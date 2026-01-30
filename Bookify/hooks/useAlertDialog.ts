import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface UseAlertDialogReturn {
  alertVisible: boolean;
  alertConfig: AlertConfig;
  showAlert: (title: string, message: string, buttons: AlertButton[]) => void;
  hideAlert: () => void;
}

export function useAlertDialog(): UseAlertDialogReturn {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((
    title: string,
    message: string,
    buttons: AlertButton[]
  ) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons.map(btn => ({
        ...btn,
        onPress: btn.onPress || (() => {}),
      })),
    });
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  return {
    alertVisible,
    alertConfig,
    showAlert,
    hideAlert,
  };
}
