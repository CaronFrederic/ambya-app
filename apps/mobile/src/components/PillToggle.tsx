import { Pressable, Text, View } from 'react-native'
import { colors, overlays } from '../theme/colors'
import { radius } from '../theme/radius'
import { spacing } from '../theme/spacing'

export function PillToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.xs,
        padding: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: overlays.white10,
      }}
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.full,
              alignItems: 'center',
              backgroundColor: active ? colors.premium : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? colors.brand : 'rgba(255,255,255,0.70)',
                fontWeight: '600',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
