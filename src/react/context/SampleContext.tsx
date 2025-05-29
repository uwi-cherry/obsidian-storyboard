
import { createContext, useContext } from 'react';

interface SampleContextValue {
  message: string;
  count: number;
}

const SampleContext = createContext<SampleContextValue>({
  message: 'Hello, Context!',
  count: 0
});

export const useSampleContext = () => {
  return useContext(SampleContext);
};

export default SampleContext; 
