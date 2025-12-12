import { supabase } from '@/lib/supabase';
const ASK_PLANTS_COLLECTIVE_URL = import.meta.env.VITE_ASK_PLANTS_COLLECTIVE_URL || "https://vwdrevguebayhyjfurag.supabase.co/functions/v1/ask-plants-collective";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  is_user_message: boolean;
  created_at: string;
  metadata?: {
    model?: string;
    response_time?: number;
    tokens?: number;
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface UserContext {
  name?: string;
  gender?: string;
  age?: number;
  skinType?: string;
  hairType?: string;
  recentAnalysis?: any;
}

/**
 * Plants Collective AI Service - Enhanced AI chat service with Supabase integration
 */
export class PlantsAIService {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title: string = 'New Conversation'): Promise<Conversation | null> {
    try {
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (testError) {
        // PGRST116 means no rows found (okay for empty table)
        // PGRST205 means table doesn't exist (needs setup)
        if (testError.code === 'PGRST205') {
          throw new Error(`Database tables not set up. Please run CONVERSATIONS_SETUP.sql in your Supabase SQL editor. Error: ${testError.message}`);
        }
        if (testError.code !== 'PGRST116') {
          console.error('Supabase connection error:', testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw new Error(`Failed to create conversation: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('No data returned from conversation creation');
      }

      return data as Conversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string, includeArchived: boolean = false): Promise<Conversation[]> {
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        // PGRST205 means table doesn't exist
        if (error.code === 'PGRST205') {
          console.error('Database tables not set up. Please run CONVERSATIONS_SETUP.sql in Supabase SQL editor.');
        }
        return [];
      }

      return data as Conversation[];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data as Message[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Save a message to Supabase
   */
  async saveMessage(
    conversationId: string,
    userId: string,
    content: string,
    isUserMessage: boolean,
    metadata?: any
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: content,
          is_user_message: isUserMessage,
          created_at: new Date().toISOString(),
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return data as Message;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  /**
   * Generate AI response with enhanced context
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: Message[],
    userContext?: UserContext
  ): Promise<{ text: string; metadata: any } | null> {
    try {
      if (!ASK_PLANTS_COLLECTIVE_URL) {
        throw new Error("Ask Plants Collective function URL is not configured.");
      }
      if (!SUPABASE_ANON_KEY) {
        throw new Error("Supabase anon key is not configured.");
      }

      const startTime = Date.now();

      const resp = await fetch(ASK_PLANTS_COLLECTIVE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
          userContext,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        let errorMessage = "Failed to generate AI response";
        
        try {
          // Try to parse the error response as JSON
          const errorData = JSON.parse(txt);
          if (errorData.error) {
            // Extract user-friendly error message
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If parsing fails, use the text as-is or default message
          if (txt && txt.length < 200) {
            errorMessage = txt;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      
      // Check if the response indicates an error even with 200 status
      if (data.success === false && data.error) {
        throw new Error(data.error);
      }
      const responseTime = Date.now() - startTime;

      // Edge function returns 'response', not 'text'
      const text = this.sanitizeResponse(data.response || data.text || "");

      if (!text || text.trim().length === 0) {
        throw new Error("AI service returned an empty response. Please try again.");
      }

      return {
        text,
        metadata: {
          model: data.model || 'gemini-1.5-flash',
          response_time: responseTime,
          timestamp: data.timestamp || new Date().toISOString(),
        }
      };
    } catch (error: any) {
      console.error('Error generating AI response (edge):', error);
      // Re-throw the error so it can be caught and displayed to the user
      throw error instanceof Error ? error : new Error(error?.message || "Failed to generate AI response");
    }
  }

  /**
   * Build system prompt with user context
   */
  private buildSystemPrompt(userContext?: UserContext): string {
    let prompt = `You are Plants Collective AI, a knowledgeable and empathetic virtual assistant specializing in skincare, haircare, beauty, and holistic wellness. You provide personalized, evidence-based advice with warmth and encouragement.

Your expertise includes:
- Skin analysis and skincare routines
- Hair health and haircare solutions
- Product recommendations (ingredients, usage)
- Lifestyle and wellness tips
- Beauty trends and techniques
- Natural and science-backed remedies`;

    if (userContext) {
      prompt += `\n\nUser Context:`;
      if (userContext.name) prompt += `\n- Name: ${userContext.name}`;
      if (userContext.gender) prompt += `\n- Gender: ${userContext.gender}`;
      if (userContext.age) prompt += `\n- Age: ${userContext.age}`;
      if (userContext.skinType) prompt += `\n- Skin Type: ${userContext.skinType}`;
      if (userContext.hairType) prompt += `\n- Hair Type: ${userContext.hairType}`;
      
      prompt += `\n\nUse this context to personalize your responses when relevant.`;
    }

    return prompt;
  }

  /**
   * Build conversation context from message history
   */
  private buildConversationContext(messages: Message[]): string {
    if (messages.length === 0) {
      return 'This is the start of a new conversation.';
    }

    // Get last 6 messages for context (to stay within token limits)
    const recentMessages = messages.slice(-6);
    
    let context = 'Previous conversation:\n';
    recentMessages.forEach(msg => {
      const role = msg.is_user_message ? 'User' : 'You';
      context += `\n${role}: ${msg.content}`;
    });

    return context;
  }

  /**
   * Update conversation title based on first message
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: title })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  /**
   * Sanitize AI response to remove malformed formatting
   */
  private sanitizeResponse(text: string): string {
    // Remove broken markdown syntax
    text = text.replace(/\*\*\s*\{/g, ''); // Remove ** {
    text = text.replace(/\}\s*\*\*/g, ''); // Remove } **
    text = text.replace(/\*\*\s*\(/g, ''); // Remove ** (
    text = text.replace(/\)\s*\*\*/g, ''); // Remove ) **
    text = text.replace(/\*\*\s*\[/g, ''); // Remove ** [
    text = text.replace(/\]\s*\*\*/g, ''); // Remove ] **
    
    // Clean up stray markdown characters
    text = text.replace(/\*\*\*+/g, ''); // Remove multiple asterisks
    text = text.replace(/___+/g, ''); // Remove multiple underscores
    text = text.replace(/\{\{/g, ''); // Remove double braces
    text = text.replace(/\}\}/g, ''); // Remove double braces
    
    // Clean up orphaned brackets and parentheses
    text = text.replace(/\{\s*\*\*/g, ''); // Remove { **
    text = text.replace(/\*\*\s*\}/g, ''); // Remove ** }
    
    // Remove any remaining lone special characters at line ends
    text = text.replace(/\s+[{\[\(]\s*$/gm, ''); // Remove trailing brackets
    text = text.replace(/^\s*[}\]\)]/gm, ''); // Remove leading brackets
    
    // Clean up excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 line breaks
    text = text.replace(/[ \t]+/g, ' '); // Single spaces
    
    // Trim each line
    text = text.split('\n').map(line => line.trim()).join('\n');
    
    return text.trim();
  }

  /**
   * Generate a conversation title from the first user message
   */
  generateConversationTitle(firstMessage: string): string {
    // Take first 50 characters or first sentence
    let title = firstMessage.substring(0, 50);
    const firstSentence = firstMessage.match(/^[^.!?]+[.!?]/);
    
    if (firstSentence && firstSentence[0].length < 60) {
      title = firstSentence[0];
    }
    
    if (title.length < firstMessage.length) {
      title += '...';
    }
    
    return title;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) {
        console.error('Error archiving conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Messages will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Get user's recent skin analysis for context
   */
  async getUserAnalysisContext(userId: string): Promise<any> {
    try {
      // Get most recent skin analysis
      const { data: skinAnalysis } = await supabase
        .from('skin_analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        skinAnalysis
      };
    } catch (error) {
      console.error('Error fetching analysis context:', error);
      return null;
    }
  }
}

// Export singleton instance
export const plantsAI = new PlantsAIService();

