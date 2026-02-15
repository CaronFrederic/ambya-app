import { TextInput, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { radius } from '../theme/radius'

type Props = React.ComponentProps<typeof TextInput>

export function Input({ style, ...props }: Props) {
  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: radius.lg,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
})
