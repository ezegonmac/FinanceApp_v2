import { TamaguiProvider, Text } from 'tamagui';
import config from '../tamagui.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimaryButton } from '@ui/Button';

const queryClient = new QueryClient();

function App() {
  return (
    <TamaguiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Text>Hello Expo!</Text>
        <PrimaryButton onPress={() => console.log('Tap!')}>Tap Me</PrimaryButton>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

export default App;