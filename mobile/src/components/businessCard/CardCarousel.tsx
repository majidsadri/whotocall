import React, { useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { BusinessCard } from '../../types/businessCard';
import { BusinessCardPreview } from './BusinessCardPreview';
import { ScannedCardPreview } from './ScannedCardPreview';
import { PrimaryIndicator } from './PrimaryIndicator';
import { colors } from '../../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_SPACING = 12;

interface CardCarouselProps {
  cards: BusinessCard[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onAddCard: () => void;
}

export function CardCarousel({
  cards,
  selectedIndex,
  onSelectIndex,
  onAddCard,
}: CardCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== selectedIndex && index >= 0 && index < cards.length) {
      onSelectIndex(index);
    }
  }, [selectedIndex, cards.length, onSelectIndex]);

  const renderCard = useCallback(({ item, index }: { item: BusinessCard; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelectIndex(index)}
      style={styles.cardWrapper}
    >
      <View style={styles.cardContainer}>
        {item.card_type === 'scanned' && item.scanned_image_url ? (
          <ScannedCardPreview
            imageUrl={item.scanned_image_url}
            label={item.card_label}
            size="large"
          />
        ) : (
          <BusinessCardPreview
            data={item}
            size="large"
          />
        )}
        {item.is_primary && (
          <View style={styles.primaryBadge}>
            <PrimaryIndicator size="medium" />
          </View>
        )}
        {item.card_type === 'scanned' && (
          <View style={styles.typeBadge}>
            <Icon name="camera" size={10} color={colors.accent} />
            <Text style={styles.typeBadgeText}>Scanned</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [onSelectIndex]);

  const renderAddButton = useCallback(() => (
    <TouchableOpacity
      style={styles.addCardButton}
      onPress={onAddCard}
      activeOpacity={0.7}
    >
      <View style={styles.addCardContent}>
        <View style={styles.addCardIconCircle}>
          <Icon name="plus" size={28} color={colors.green[600]} />
        </View>
        <Text style={styles.addCardText}>Add Card</Text>
        <Text style={styles.addCardSubtext}>Create or scan</Text>
      </View>
    </TouchableOpacity>
  ), [onAddCard]);

  const data = [...cards, { id: 'add-button' }] as (BusinessCard | { id: string })[];

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          if (item.id === 'add-button') {
            return renderAddButton();
          }
          return renderCard({ item: item as BusinessCard, index });
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />

      {/* Pagination dots */}
      {cards.length > 1 && (
        <View style={styles.pagination}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === selectedIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  cardContainer: {
    position: 'relative',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
  },
  addCardButton: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.green[300],
    backgroundColor: colors.green[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardContent: {
    alignItems: 'center',
  },
  addCardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.green[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.green[700],
    marginBottom: 4,
  },
  addCardSubtext: {
    fontSize: 14,
    color: colors.green[500],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green[200],
  },
  dotActive: {
    backgroundColor: colors.green[600],
    width: 24,
  },
});
