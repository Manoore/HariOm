import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, ghost, outline
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    if (disabled) {
      baseStyle.push(styles.button_disabled);
    }
    
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.button_secondary);
        break;
      case 'ghost':
        baseStyle.push(styles.button_ghost);
        break;
      case 'outline':
        baseStyle.push(styles.button_outline);
        break;
      default:
        break;
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];
    
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonText_secondary);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonText_ghost);
        break;
      case 'outline':
        baseStyle.push(styles.buttonText_outline);
        break;
      default:
        baseStyle.push(styles.buttonText_primary);
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonText_disabled);
    }
    
    return baseStyle;
  };

  const content = (
    <View style={styles.buttonContent}>
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.white : COLORS.saffron} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[style]}
        {...props}
      >
        <LinearGradient
          colors={GRADIENTS.saffron}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[...getButtonStyle(), SHADOWS.medium]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[...getButtonStyle(), style]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

export const GoldButton = ({ title, onPress, style, ...props }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={style}
    {...props}
  >
    <LinearGradient
      colors={GRADIENTS.gold}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.button, styles.button_medium, SHADOWS.medium]}
    >
      <Text style={[styles.buttonText, styles.buttonText_medium, { color: COLORS.maroon }]}>
        {title}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 48,
  },
  button_large: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    minHeight: 56,
  },
  button_secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.maroon,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.saffron,
  },
  button_disabled: {
    backgroundColor: COLORS.gray[300],
    borderColor: COLORS.gray[300],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_small: {
    fontSize: 13,
  },
  buttonText_medium: {
    fontSize: 15,
  },
  buttonText_large: {
    fontSize: 17,
  },
  buttonText_primary: {
    color: COLORS.white,
  },
  buttonText_secondary: {
    color: COLORS.maroon,
  },
  buttonText_ghost: {
    color: COLORS.maroon,
  },
  buttonText_outline: {
    color: COLORS.saffron,
  },
  buttonText_disabled: {
    color: COLORS.gray[500],
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
