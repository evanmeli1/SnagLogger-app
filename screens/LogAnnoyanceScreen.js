import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Animated, PanResponder, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function LogAnnoyanceScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [touchBlobs, setTouchBlobs] = useState([]);

  const maxCharacters = 200;

  // Animation values
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;
  const sliderAnim = useRef(new Animated.Value(0)).current;
  const suggestionsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  const quickSuggestions = [
    'Loud neighbors',
    'Slow internet',
    'Bad weather',
    'Long wait times',
  ];

  // Touch blob creation
  const createTouchBlob = (x, y) => {
    const id = Date.now() + Math.random();
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0.8);
    
    const newBlob = {
      id,
      x: x - 25,
      y: y - 25,
      scaleAnim,
      opacityAnim,
    };
    
    setTouchBlobs(prev => [...prev, newBlob]);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTouchBlobs(prev => prev.filter(blob => blob.id !== id));
    });
  };

  // Pan responder for touch detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      createTouchBlob(locationX, locationY);
    },
  });

  useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Form animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(formFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Slider animation
    setTimeout(() => {
      Animated.timing(sliderAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);

    // Suggestions animation
    setTimeout(() => {
      Animated.timing(suggestionsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 700);

    // Button animation
    setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 900);

    // Floating blob animations
    const createFloatingAnimation = (animValue) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 4500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(blob1Float).start();
    createFloatingAnimation(blob2Float).start();
    createFloatingAnimation(blob3Float).start();
  }, []);

 const handleNext = () => {
  if (!description.trim()) {
    Alert.alert('Hold on!', 'Please describe what annoyed you');
    return;
  }
  
  navigation.navigate('CategorySelection', {
    description,
    intensity,
  });
};

  const getIntensityLabel = (value) => {
    if (value <= 2) return 'Barely annoying';
    if (value <= 4) return 'Mildly annoying';
    if (value <= 6) return 'Pretty annoying';
    if (value <= 8) return 'Very annoying';
    return 'Extremely annoying';
  };

  const getIntensityEmoji = (value) => {
    if (value <= 2) return '😐';
    if (value <= 4) return '😒';
    if (value <= 6) return '😤';
    if (value <= 8) return '😡';
    return '🤬';
  };

  const applySuggestion = (suggestion) => {
    setDescription(suggestion);
  };

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Floating blobs */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1,
          {
            transform: [
              {
                translateY: blob1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                })
              },
              { rotate: '8deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob2,
          {
            transform: [
              {
                translateY: blob2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 18],
                })
              },
              { rotate: '-22deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob3,
          {
            transform: [
              {
                translateY: blob3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                })
              },
              { rotate: '35deg' }
            ]
          }
        ]} 
      />

      {/* Touch-responsive blobs */}
      {touchBlobs.map((blob) => (
        <Animated.View
          key={blob.id}
          style={[
            styles.touchBlob,
            {
              left: blob.x,
              top: blob.y,
              opacity: blob.opacityAnim,
              transform: [
                {
                  scale: blob.scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  })
                }
              ]
            }
          ]}
        />
      ))}

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Annoyance</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: formFadeAnim,
              transform: [{ translateY: formSlideAnim }]
            }
          ]}
        >
          {/* Text Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>What annoyed you?</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Slow cashier at grocery store..."
                placeholderTextColor="#9A9A9A"
                multiline
                maxLength={maxCharacters}
              />
              <Text style={styles.characterCount}>
                Character count: {description.length}/{maxCharacters}
              </Text>
            </View>
          </View>

          {/* Intensity Slider Section */}
          <Animated.View style={[styles.sliderSection, { opacity: sliderAnim }]}>
            <Text style={styles.sectionLabel}>How annoying was it?</Text>
            <View style={styles.sliderCard}>
              <View style={styles.emojiScale}>
                <Text style={styles.scaleEmoji}>😐</Text>
                <Text style={styles.scaleEmoji}>😒</Text>
                <Text style={styles.scaleEmoji}>😤</Text>
                <Text style={styles.scaleEmoji}>😡</Text>
                <Text style={styles.scaleEmoji}>🤬</Text>
              </View>
              <View style={styles.scaleNumbers}>
                <Text style={styles.scaleNumber}>1</Text>
                <Text style={styles.scaleNumber}>3</Text>
                <Text style={styles.scaleNumber}>5</Text>
                <Text style={styles.scaleNumber}>7</Text>
                <Text style={styles.scaleNumber}>9</Text>
                <Text style={styles.scaleNumber}>10</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={intensity}
                onValueChange={setIntensity}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="rgba(139, 92, 246, 0.2)"
                thumbTintColor="#8B5CF6"
              />
              <View style={styles.intensityDisplay}>
                <Text style={styles.intensityEmoji}>{getIntensityEmoji(intensity)}</Text>
                <Text style={styles.intensityValue}>{intensity}/10</Text>
              </View>
              <Text style={styles.intensityLabel}>"{getIntensityLabel(intensity)}"</Text>
            </View>
          </Animated.View>

          {/* Quick Suggestions Section */}
          <Animated.View style={[styles.suggestionsSection, { opacity: suggestionsAnim }]}>
            <Text style={styles.sectionLabel}>Quick Suggestions:</Text>
            <View style={styles.suggestionsGrid}>
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => applySuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Next Button */}
          <Animated.View style={{ opacity: buttonAnim }}>
            <TouchableOpacity 
              style={[styles.nextButton, !description.trim() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!description.trim() || loading}
            >
              <Text style={styles.nextButtonText}>
                {loading ? 'Processing...' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 100,
  },
  blob1: {
    width: 130,
    height: 220,
    top: 50,
    left: -40,
  },
  blob2: {
    width: 100,
    height: 170,
    top: 200,
    right: -30,
  },
  blob3: {
    width: 80,
    height: 140,
    bottom: 100,
    left: 20,
  },
  touchBlob: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A4A4A',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    fontSize: 16,
    color: '#4A4A4A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#9A9A9A',
    textAlign: 'right',
  },
  sliderSection: {
    marginBottom: 28,
  },
  sliderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleEmoji: {
    fontSize: 20,
  },
  scaleNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  scaleNumber: {
    fontSize: 12,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  intensityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  intensityEmoji: {
    fontSize: 28,
  },
  intensityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  intensityLabel: {
    fontSize: 16,
    color: '#6A6A6A',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  suggestionsSection: {
    marginBottom: 28,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#2D2D2D',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9A9A9A',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});