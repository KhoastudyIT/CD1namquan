import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from './api.js';

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const useSettings = () => useContext(AppContext)?.settings || DEFAULT_SETTINGS;
