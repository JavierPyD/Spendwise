import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'list.bullet': 'list',
  'chart.pie': 'pie-chart',
  'lightbulb': 'lightbulb',
  'trash': 'delete',
  'pencil': 'edit',
  'plus': 'add',
  'checkmark': 'check',
  'xmark': 'close',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'exclamationmark.triangle': 'warning',
  'info.circle': 'info',
  'star.fill': 'star',
  'flag.fill': 'flag',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
