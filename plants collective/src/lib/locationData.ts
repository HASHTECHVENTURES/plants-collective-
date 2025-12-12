import { locationData, type Country, type State, type City } from './locationDataComprehensive';

export type SimpleCountry = { name: string; code: string };
export type SimpleState = { name: string; code: string };
export type SimpleCity = { name: string; id: number };

export const getCountries = (): SimpleCountry[] => {
	return locationData.countries.map((c: Country) => ({ name: c.name, code: c.code }));
};

export const getStatesByCountry = (countryName: string): SimpleState[] => {
	const country = locationData.countries.find((c: Country) => c.name === countryName);
	return country ? country.states.map((s: State) => ({ name: s.name, code: s.code })) : [];
};

export const getCitiesByState = (countryName: string, stateName: string): SimpleCity[] => {
	const country = locationData.countries.find((c: Country) => c.name === countryName);
	if (!country) return [];
	const state = country.states.find((s: State) => s.name === stateName);
	return state ? state.cities.map((ci: City) => ({ name: ci.name, id: ci.id })) : [];
};

export const getCountryCodeByName = (countryName: string): string | undefined => {
	return locationData.countries.find((c: Country) => c.name === countryName)?.code;
};

