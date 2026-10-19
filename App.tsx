import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/app/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
