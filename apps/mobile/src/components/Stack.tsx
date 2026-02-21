import { View } from 'react-native'

export function Stack({
  children,
  gap = 12,
  style,
}: {
  children: React.ReactNode
  gap?: number
  style?: any
}) {
  return (
    <View style={[{ gap }, style]}>
      {children}
    </View>
  )
}
