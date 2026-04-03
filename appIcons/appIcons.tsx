import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TextStyle } from 'react-native';

type IconProps = {
  size?: number;
  color?: string;
  style?: TextStyle;
};

export const Icons = {
  attendance: (props: IconProps) => (
    <MaterialIcons name="calendar-month" size={24} {...props} />
  ),

  exam: (props: IconProps) => (
    <Ionicons name="clipboard" size={24} {...props} />
  ),

  leave: (props: IconProps) => (
    <Ionicons name="bed" size={24} {...props} />
  ),

  fees: (props: IconProps) => (
    <MaterialIcons name="account-balance-wallet" size={24} {...props} />
  ),

  homework: (props: IconProps) => (
    <MaterialIcons name="assignment" size={24} {...props} />
  ),

  docs: (props: IconProps) => (
    <Ionicons name="folder-open" size={24} {...props} />
  ),

  message: (props: IconProps) => (
    <Ionicons name="chatbubbles" size={24} {...props} />
  ),

  notice: (props: IconProps) => (
    <Ionicons name="megaphone" size={24} {...props} />
  ),
  // admin icons extra 
  teacher: (props: IconProps) => (
    <Ionicons name="people-outline" size={24} {...props} />
  ),
  timetable: (props: IconProps) => (
    <Ionicons name="time-outline" size={24} {...props} />
  ),
  students: (props: IconProps) => (
    <Ionicons name="school-outline" size={24} {...props} />
  ),

  // staff icons extra

  notes: (props: IconProps) => (
    <Ionicons name="create-outline" size={24} {...props} />
  ),
  
};