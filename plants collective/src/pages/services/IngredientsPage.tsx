import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Leaf, Droplets, Sun, Sparkles, ExternalLink } from "lucide-react";
import { openExternalLink } from "@/lib/externalLinkHandler";

const IngredientsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const ingredients = [
    {
      name: "Hyaluronic Acid",
      icon: Droplets,
      category: "Hydrating",
      benefits: ["Intense hydration", "Plumps skin", "Reduces fine lines", "Suitable for all skin types"],
      description: "A powerful humectant that can hold up to 1000x its weight in water"
    },
    {
      name: "Vitamin C",
      icon: Sun,
      category: "Antioxidant", 
      benefits: ["Brightens skin", "Fights free radicals", "Boosts collagen", "Fades dark spots"],
      description: "A potent antioxidant that protects and brightens the skin"
    },
    {
      name: "Retinol",
      icon: Sparkles,
      category: "Anti-aging",
      benefits: ["Reduces wrinkles", "Improves texture", "Unclogs pores", "Stimulates collagen"],
      description: "A vitamin A derivative that accelerates cell turnover"
    },
    {
      name: "Niacinamide",
      icon: Leaf,
      category: "Multi-purpose",
      benefits: ["Controls oil", "Minimizes pores", "Reduces redness", "Strengthens barrier"],
      description: "A form of vitamin B3 that helps with multiple skin concerns"
    },
    {
      name: "Salicylic Acid",
      icon: Droplets,
      category: "Exfoliating",
      benefits: ["Unclogs pores", "Reduces acne", "Smooths texture", "Oil-soluble"],
      description: "A beta-hydroxy acid that penetrates deep into pores"
    },
    {
      name: "Ceramides",
      icon: Leaf,
      category: "Barrier Repair",
      benefits: ["Restores barrier", "Locks in moisture", "Soothes irritation", "Strengthens skin"],
      description: "Natural lipids that help maintain the skin barrier"
    }
  ];

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Hydrating": return "bg-blue-100 text-blue-800";
      case "Antioxidant": return "bg-orange-100 text-orange-800";
      case "Anti-aging": return "bg-purple-100 text-purple-800";
      case "Multi-purpose": return "bg-green-100 text-green-800";
      case "Exfoliating": return "bg-red-100 text-red-800";
      case "Barrier Repair": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-plants-cream via-background to-plants-light-gold">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">Ingredients</h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 gesture-safe-bottom android-safe-container">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Skincare Ingredients Guide</CardTitle>
            <p className="text-center text-muted-foreground">
              Learn about powerful ingredients and their benefits
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredIngredients.map((ingredient, index) => (
            <Card key={index} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-plants-gold to-accent rounded-full flex items-center justify-center">
                    <ingredient.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{ingredient.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ingredient.category)}`}>
                        {ingredient.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm">{ingredient.description}</p>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Key Benefits:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {ingredient.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-plants-gold rounded-full"></div>
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIngredients.length === 0 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No ingredients found matching your search</p>
            </CardContent>
          </Card>
        )}

        {/* Labothecary Link - Connect to Notion */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-plants-light-gold to-plants-cream">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Plants Collective's Labothecary</h3>
            <p className="text-muted-foreground mb-4">
              Explore our comprehensive ingredient database and learn more about skincare science
            </p>
            <Button 
              onClick={async () => {
                await openExternalLink('https://lateral-biplane-a08.notion.site/Plants-Collective-s-Labothecary-22568ba9b2b680babcb7c385b8b42df8');
              }}
              className="bg-gradient-to-r from-plants-gold to-accent w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Labothecary
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-plants-light-gold to-plants-cream">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Build Your Routine</h3>
            <p className="text-muted-foreground mb-4">
              Create a personalized skincare routine with these ingredients
            </p>
            <Button 
              onClick={() => navigate("/skin-ritual")}
              className="bg-gradient-to-r from-plants-gold to-accent"
            >
              Create Routine
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IngredientsPage;