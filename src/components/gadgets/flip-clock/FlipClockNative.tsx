/**
 * FlipClockNative - React Native version of FlipClock
 *
 * Architecture:
 * - Uses shared FlipClockModel + useFlipClockTime
 * - Same component hierarchy as web (DoubleFlipCard → FlipDigit)
 * - LinearGradient for metallic rim and gloss overlay
 * - Animated.View flip animation (TODO)
 *
 * Visual differences from web:
 * - Gloss overlay using LinearGradient (instead of Skia)
 * - 24h format (no AM/PM badge)
 * - Slightly adjusted spacing/padding for RN constraints
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useFlipClockTime } from './useFlipClockTime'
import type { DigitPair } from './FlipClockModel'

export const FlipClockNative: React.FC = () => {
  const timeState = useFlipClockTime()

  return (
    <LinearGradient
      colors={['#fefefe', '#d0d0d0', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.outerRim}
    >
      <View style={styles.innerRim}>
        <View style={styles.face}>
          {/* Gloss overlay - acrylic effect */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.45)',
              'rgba(255,255,255,0.15)',
              'rgba(0,0,0,0.08)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gloss}
            pointerEvents="none"
          />

          <View style={styles.content}>
            {/* Time row (HH MM) - 24h format, no AM/PM */}
            <View style={styles.timeRow}>
              <DoubleFlipCardNative
                left={timeState.hourTens}
                right={timeState.hourOnes}
              />
              <DoubleFlipCardNative
                left={timeState.minuteTens}
                right={timeState.minuteOnes}
              />
            </View>

            {/* Day row */}
            <View style={styles.centerRow}>
              <FlipCardNative value={timeState.day} isWide />
            </View>

            {/* Date row (DD MMM) */}
            <View style={styles.dateRow}>
              <DoubleFlipCardNative
                left={timeState.dateTens}
                right={timeState.dateOnes}
              />
              <FlipCardNative value={timeState.month} />
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  )
}

// ============================================================================
// Child components - same API as web version
// ============================================================================

type DoubleFlipCardNativeProps = {
  left: DigitPair
  right: DigitPair
}

const DoubleFlipCardNative: React.FC<DoubleFlipCardNativeProps> = ({
  left,
  right,
}) => {
  return (
    <View style={styles.doubleFlipCard}>
      {/* Shared black card container */}
      <LinearGradient
        colors={['#1e1e1e', '#0d0d0d', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.doubleCardContainer}
      >
        {/* Left digit */}
        <View style={styles.digitHalf}>
          <FlipDigitNative value={left.value} previous={left.previous} />
        </View>

        {/* Right digit */}
        <View style={styles.digitHalf}>
          <FlipDigitNative value={right.value} previous={right.previous} />
        </View>
      </LinearGradient>
    </View>
  )
}

type FlipDigitNativeProps = {
  value: string
  previous: string
}

const FlipDigitNative: React.FC<FlipDigitNativeProps> = ({
  value,
  previous,
}) => {
  const isFlipping = value !== previous

  // TODO: Implement Animated flip
  // const flipAnim = useRef(new Animated.Value(0)).current
  //
  // useEffect(() => {
  //   if (!isFlipping) return
  //   flipAnim.setValue(0)
  //   Animated.timing(flipAnim, {
  //     toValue: 1,
  //     duration: 600,
  //     easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  //     useNativeDriver: true,
  //   }).start()
  // }, [isFlipping])
  //
  // const rotateX = flipAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', '-180deg'],
  // })

  return (
    <View style={styles.flipDigitContainer}>
      {/* Top half gradient */}
      <LinearGradient
        colors={['#242424', '#0d0d0d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.halfBackground, styles.topHalf]}
      />

      {/* Bottom half gradient */}
      <LinearGradient
        colors={['#0d0d0d', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.halfBackground, styles.bottomHalf]}
      />

      {/* Digit display */}
      <View style={styles.digitDisplay}>
        <Text style={styles.digitText}>{value}</Text>
      </View>

      {/* TODO: Animated flipping card
      {isFlipping && (
        <Animated.View
          style={[
            styles.flippingCard,
            {
              transform: [{ perspective: 1200 }, { rotateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['#242424', '#0d0d0d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.flippingCardGradient}
          >
            <Text style={[styles.digitText, styles.flippingText]}>{value}</Text>
          </LinearGradient>
        </Animated.View>
      )}
      */}

      {/* Center divider */}
      <View style={styles.divider} />
    </View>
  )
}

type FlipCardNativeProps = {
  value: DigitPair
  isWide?: boolean
}

const FlipCardNative: React.FC<FlipCardNativeProps> = ({ value, isWide }) => {
  const isFlipping = value.value !== value.previous

  return (
    <View style={[styles.flipCard, isWide && styles.flipCardWide]}>
      {/* Card gradient container */}
      <LinearGradient
        colors={['#1e1e1e', '#0d0d0d', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardContainer}
      >
        {/* Top half */}
        <LinearGradient
          colors={['#242424', '#0d0d0d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.halfBackground, styles.topHalf]}
        />

        {/* Bottom half */}
        <LinearGradient
          colors={['#0d0d0d', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.halfBackground, styles.bottomHalf]}
        />

        {/* Text display */}
        <View style={styles.textDisplay}>
          <Text
            style={[
              styles.cardText,
              isWide ? styles.cardTextWide : styles.cardTextMonth,
            ]}
          >
            {value.value}
          </Text>
        </View>

        {/* TODO: Animated flip */}

        {/* Center divider */}
        <View style={styles.divider} />
      </LinearGradient>
    </View>
  )
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Outer metallic rim
  outerRim: {
    padding: 10,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  // Inner recessed border (dark dip)
  innerRim: {
    padding: 8,
    borderRadius: 26,
    backgroundColor: '#14141b',
  },

  // Clock face (light background)
  face: {
    borderRadius: 22,
    backgroundColor: '#f4f5f7',
    paddingVertical: 18,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },

  // Gloss overlay
  gloss: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    opacity: 0.9,
  },

  // Content layout
  content: {
    position: 'relative',
    justifyContent: 'space-between',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  centerRow: {
    marginTop: 12,
    alignItems: 'center',
  },

  dateRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  // Double flip card (for paired digits)
  doubleFlipCard: {
    width: 80,
    height: 90,
  },

  doubleCardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    flexDirection: 'row',
  },

  digitHalf: {
    width: '50%',
    height: '100%',
  },

  // Flip digit
  flipDigitContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  halfBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  topHalf: {
    top: 0,
    height: '50%',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
  },

  bottomHalf: {
    bottom: 0,
    height: '50%',
  },

  digitDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  digitText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fafafa',
    lineHeight: 56,
  },

  divider: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
    zIndex: 10,
  },

  // Flip card (for text: day/month)
  flipCard: {
    width: 80,
    height: 90,
  },

  flipCardWide: {
    width: 190,
    height: 50,
  },

  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },

  textDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  cardText: {
    fontWeight: '900',
    color: '#fafafa',
  },

  cardTextWide: {
    fontSize: 32,
    letterSpacing: 4,
    // TODO: Add scaleY transform
  },

  cardTextMonth: {
    fontSize: 38,
    letterSpacing: 1,
    // TODO: Add scaleY transform
  },

  // TODO: Flipping card animation styles
  // flippingCard: {
  //   position: 'absolute',
  //   top: '50%',
  //   left: 0,
  //   right: 0,
  //   height: '50%',
  //   overflow: 'hidden',
  //   zIndex: 5,
  // },
  // flippingCardGradient: {
  //   flex: 1,
  //   alignItems: 'center',
  //   justifyContent: 'flex-start',
  // },
  // flippingText: {
  //   transform: [{ translateY: -28 }],
  // },
})
