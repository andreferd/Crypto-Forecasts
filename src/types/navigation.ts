import { NavigatorScreenParams } from '@react-navigation/native';

export type MarketsStackParamList = {
  Dashboard: undefined;
  CryptoDetail: { symbol: string };
  Settings: undefined;
};

export type RootTabParamList = {
  Markets: NavigatorScreenParams<MarketsStackParamList>;
  Accuracy: undefined;
  Predict: undefined;
};

// Keep backward compat alias for existing screen imports
export type RootStackParamList = MarketsStackParamList;
