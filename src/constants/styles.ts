export const LIQUID_GLASS = {
  blur: {
    small: 'blur(10px) saturate(180%)',
    medium: 'blur(20px) saturate(180%)',
    large: 'blur(20px) saturate(180%)',
  },
  background: {
    light: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(241, 245, 249, 0.4))',
    medium: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
    container: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
    dark: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
  },
  shadow: {
    light: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    dark: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    container: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  },
  border: {
    light: '1px solid rgba(255, 255, 255, 0.3)',
    medium: '1px solid rgba(255, 255, 255, 0.4)',
    dark: '1px solid rgba(255, 255, 255, 0.1)',
  },
  color: {
    text: {
      primary: '#475569',
      white: '#ffffff',
    },
  },
} as const;

export const getLiquidGlassButtonStyle = (isActive: boolean = false) => ({
  background: isActive ? LIQUID_GLASS.background.dark : LIQUID_GLASS.background.light,
  backdropFilter: LIQUID_GLASS.blur.small,
  WebkitBackdropFilter: LIQUID_GLASS.blur.small,
  color: isActive ? LIQUID_GLASS.color.text.white : LIQUID_GLASS.color.text.primary,
  boxShadow: isActive ? LIQUID_GLASS.shadow.dark : LIQUID_GLASS.shadow.light,
  border: isActive ? LIQUID_GLASS.border.dark : LIQUID_GLASS.border.light,
});

export const getLiquidGlassSelectStyle = () => ({
  background: LIQUID_GLASS.background.medium,
  backdropFilter: LIQUID_GLASS.blur.small,
  WebkitBackdropFilter: LIQUID_GLASS.blur.small,
  border: LIQUID_GLASS.border.medium,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
});

export const getLiquidGlassContainerStyle = () => ({
  background: LIQUID_GLASS.background.container,
  backdropFilter: LIQUID_GLASS.blur.medium,
  WebkitBackdropFilter: LIQUID_GLASS.blur.medium,
  boxShadow: LIQUID_GLASS.shadow.container,
  border: LIQUID_GLASS.border.light,
});

