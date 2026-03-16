import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecure = isPassword && !showPassword;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={actualSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            icon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.gray[500]}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconRight}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export const SearchInput = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
  style,
  ...props
}) => {
  return (
    <View style={[styles.searchContainer, style]}>
      <Ionicons name="search-outline" size={20} color={COLORS.gray[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        style={styles.searchInput}
        {...props}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    paddingHorizontal: 16,
    minHeight: 52,
    ...SHADOWS.small,
  },
  inputContainerFocused: {
    borderColor: COLORS.saffron,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.gray[100],
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[800],
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[800],
    marginLeft: 10,
    marginRight: 10,
  },
});

export default Input;
