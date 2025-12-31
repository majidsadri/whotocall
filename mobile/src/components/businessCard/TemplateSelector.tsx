import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
          <View style={[styles.thumbnail, styles.thumbnailMinimal, isSelected && styles.thumbnailSelected]}>
            <View style={styles.minimalLayout}>
              <View style={styles.minimalAvatar} />
              <View style={styles.minimalLines}>
                <View style={[styles.line, { width: '70%' }]} />
                <View style={[styles.line, styles.lineShort, { width: '50%' }]} />
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CARD DESIGN</Text>
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
    gap: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 14,
    paddingHorizontal: 4,
  },
  templateOption: {
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 110,
    height: 72,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: colors.green[600],
    shadowColor: colors.green[600],
    shadowOpacity: 0.15,
  },
  thumbnailClassic: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailModern: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailMinimal: {
    backgroundColor: colors.green[50],
    justifyContent: 'center',
  },
  classicAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green[100],
    marginBottom: 6,
  },
  classicLines: {
    alignItems: 'center',
    gap: 4,
  },
  modernAccent: {
    width: 4,
    height: '100%',
    backgroundColor: colors.green[500],
    borderRadius: 2,
    marginRight: 8,
  },
  modernContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green[100],
    marginRight: 8,
  },
  modernLines: {
    flex: 1,
    gap: 4,
  },
  minimalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  minimalAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.green[200],
    marginRight: 8,
  },
  minimalLines: {
    flex: 1,
    gap: 4,
  },
  line: {
    height: 5,
    backgroundColor: colors.gray[200],
    borderRadius: 2.5,
  },
  lineShort: {
    height: 4,
    backgroundColor: colors.gray[150] || colors.gray[100],
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[500],
  },
  templateNameSelected: {
    color: colors.green[700],
    fontWeight: '600',
  },
  checkmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
