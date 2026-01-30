import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

interface ScreenInfo {
  width: number;
  height: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  contentHeight: number; 
}

export function useScreenInfo(): ScreenInfo {
  const insets = useSafeAreaInsets();
  
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const contentHeight = dimensions.height - insets.top - insets.bottom;

  return {
    width: dimensions.width,
    height: dimensions.height,
    safeAreaTop: insets.top,
    safeAreaBottom: insets.bottom,
    safeAreaLeft: insets.left,
    safeAreaRight: insets.right,
    contentHeight: contentHeight,
  };
}