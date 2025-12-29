import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { TemplateId, CARD_TEMPLATES } from '../../types/businessCard';
import { colors } from '../../styles/colors';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const renderTemplateThumbnail = (templateId: TemplateId) => {
    const isSelected = selectedTemplate === templateId;

    switch (templateId) {
      case 'classic':
        return (
          <View style={[styles.thumbnail, styles.thumbnailClassic, isSelected && styles.thumbnailSelected]}>
            <View style={styles.classicAvatar} />
            <View style={styles.classicLines}>
              <View style={[styles.line, { width: '60%' }]} />
              <View style={[styles.line, styles.lineShort, { width: '40%' }]} />
            </View>
          </View>
        );
      case 'modern':
        return (
          <View style={[styles.thumbnail, styles.thumbnailModern, isSelected && styles.thumbnailSelected]}>
            <View style={styles.modernAccent} />
            <View style={styles.modernContent}>
              <View style={styles.modernAvatar} />
              <View style={styles.modernLines}>
                <View style={[styles.line, { width: '70%' }]} />
                <View style={[styles.line, styles.lineShort, { width: '50%' }]} />
              </View>
            </View>
          </View>
        );
      case 'gradient':
        return (
          <LinearGradient
            colors={[colors.purple[600], colors.cyan[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.thumbnail, styles.thumbnailGradient, isSelected && styles.thumbnailSelected]}
          >
            <View style={styles.gradientAvatar} />
            <View style={styles.gradientLines}>
              <View style={[styles.line, styles.lineLight, { width: '50%' }]} />
              <View style={[styles.line, styles.lineLight, styles.lineShort, { width: '35%' }]} />
            </View>
          </LinearGradient>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Card Design</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CARD_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <TouchableOpacity
              key={template.id}
              style={styles.templateOption}
              onPress={() => onSelectTemplate(template.id)}
              activeOpacity={0.7}
            >
              {renderTemplateThumbnail(template.id)}
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                  {template.name}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Icon name="check" size={12} color={colors.white} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 12,
    paddingHorizontal: 4,
  },
  templateOption: {
    alignItems: 'center',
    gap: 8,
  },
  thumbnail: {
    width: 100,
    height: 64,
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: colors.purple[500],
  },
  thumbnailClassic: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailModern: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.purple[600],
    marginBottom: 4,
  },
  classicLines: {
    alignItems: 'center',
    gap: 3,
  },
  modernAccent: {
    width: 4,
    height: '100%',
    backgroundColor: colors.purple[600],
    borderRadius: 2,
    marginRight: 6,
  },
  modernContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.purple[600],
    marginRight: 6,
  },
  modernLines: {
    flex: 1,
    gap: 3,
  },
  gradientAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  gradientLines: {
    alignItems: 'center',
    gap: 3,
  },
  line: {
    height: 4,
    backgroundColor: colors.gray[600],
    borderRadius: 2,
  },
  lineShort: {
    height: 3,
  },
  lineLight: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
  },
  templateNameSelected: {
    color: colors.purple[400],
    fontWeight: '600',
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.purple[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
