import { StyleSheet, Text, View, TouchableOpacity, Animated, PanResponder, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';

export default function WelcomeScreen({ navigation }) {
  const [touchBlobs, setTouchBlobs] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  
  // Animation values
  const cardSlideAnim = useRef(new Animated.Value(50)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const button1Anim = useRef(new Animated.Value(0)).current;
  const button2Anim = useRef(new Animated.Value(0)).current;
  const linkAnim = useRef(new Animated.Value(0)).current;
  
  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;
  const blob4Float = useRef(new Animated.Value(0)).current;

  // Modal animations
  const modalSlideAnim = useRef(new Animated.Value(30)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;

  // Button refs for measuring position
  const signUpButtonRef = useRef();
  const signInButtonRef = useRef();

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
    // Content entrance animation
    Animated.parallel([
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered button animations
    setTimeout(() => {
      Animated.timing(button1Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 300);

    setTimeout(() => {
      Animated.timing(button2Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 500);

    setTimeout(() => {
      Animated.timing(linkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 700);

    // Floating blob animations
    const createFloatingAnimation = (animValue) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(blob1Float).start();
    createFloatingAnimation(blob2Float).start();
    createFloatingAnimation(blob3Float).start();
    createFloatingAnimation(blob4Float).start();
  }, []);

  // Modal animations
  useEffect(() => {
    if (showGuestModal) {
      // Reset animations
      modalSlideAnim.setValue(30);
      modalFadeAnim.setValue(0);
      overlayFadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(overlayFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showGuestModal]);

  const handleGuestMode = () => {
    setShowGuestModal(true);
  };

  const closeGuestModal = () => {
    Animated.parallel([
      Animated.timing(overlayFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowGuestModal(false);
    });
  };

  const proceedAsGuest = () => {
    closeGuestModal();
    setTimeout(() => {
      navigation.navigate('MainTabs');
    }, 300);
  };

  // Enhanced button press with blob burst
  const animatedButtonPress = (callback, buttonRef) => {
    const scaleAnim = new Animated.Value(1);
    
    // Create multiple blobs around button
    if (buttonRef && buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        const centerX = px + width / 2;
        const centerY = py + height / 2;
        
        // Create 5 blobs in a burst pattern
        for (let i = 0; i < 5; i++) {
          const angle = (i * 72) * (Math.PI / 180);
          const radius = 30;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          setTimeout(() => createTouchBlob(x, y), i * 50);
        }
      });
    }
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Animated floating blobs */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1,
          {
            transform: [
              {
                translateY: blob1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                })
              },
              { rotate: '15deg' }
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
                  outputRange: [0, 15],
                })
              },
              { rotate: '-20deg' }
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
              { rotate: '25deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob4,
          {
            transform: [
              {
                translateY: blob4Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                })
              },
              { rotate: '-15deg' }
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
      
      {/* Content with logo */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: cardFadeAnim,
            transform: [{ translateY: cardSlideAnim }]
          }
        ]}
      >
        <Image 
          source={require('../assets/journaling-girl2.png')}
          style={[styles.logo, { tintColor: undefined }]}
          resizeMode="contain"
          blendMode="multiply"
        />
        
        <Text style={styles.title}>The Snag Log</Text>
        <Text style={styles.subtitle}>Track daily frustrations and discover your patterns</Text>
        
        <Animated.View style={{ opacity: button1Anim, width: '100%' }}>
          <TouchableOpacity 
            ref={signUpButtonRef}
            style={styles.primaryButton}
            onPress={() => animatedButtonPress(() => navigation.navigate('SignUp'), signUpButtonRef)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>SIGN UP</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ opacity: button2Anim, width: '100%' }}>
          <TouchableOpacity 
            ref={signInButtonRef}
            style={styles.secondaryButton}
            onPress={() => animatedButtonPress(() => navigation.navigate('SignIn'), signInButtonRef)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Log in</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ opacity: linkAnim }}>
          <TouchableOpacity onPress={() => animatedButtonPress(handleGuestMode)}>
            <Text style={styles.linkText}>Try without account</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Guest Mode Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeGuestModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: overlayFadeAnim }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: modalFadeAnim,
                transform: [{ translateY: modalSlideAnim }]
              }
            ]}
          >
            {/* Modal Background Gradient */}
            <LinearGradient
              colors={['#F0E8FF', '#E8D5FF', '#DCC9F7']}
              locations={[0, 0.6, 1]}
              style={styles.modalGradient}
            >
              {/* Decorative elements */}
              <View style={styles.modalDecorBlob1} />
              <View style={styles.modalDecorBlob2} />
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={styles.guestIcon}>
                    <Text style={styles.guestIconText}>👤</Text>
                  </View>
                  <Text style={styles.modalTitle}>Guest Mode</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeGuestModal}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                <View style={styles.warningSection}>
                  <View style={styles.warningIconContainer}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                  </View>
                  <View style={styles.warningTextContainer}>
                    <Text style={styles.warningTitle}>Heads up!</Text>
                    <Text style={styles.warningText}>Your data won't be saved</Text>
                  </View>
                </View>

                <View style={styles.limitationsCard}>
                  <Text style={styles.withoutAccountTitle}>Without an account:</Text>
                  <View style={styles.bulletPoints}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Data deleted if you uninstall app</Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>No sync across devices</Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Limited backup options</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.encouragementCard}>
                  <Text style={styles.encouragementIcon}>💡</Text>
                  <Text style={styles.encouragementText}>
                    You can create an account anytime to save your progress and unlock all features!
                  </Text>
                </View>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={closeGuestModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={proceedAsGuest}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
    paddingTop: 150,
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 100,
  },
  blob1: {
    width: 120,
    height: 200,
    top: 100,
    left: -20,
  },
  blob2: {
    width: 80,
    height: 160,
    top: 80,
    right: 20,
  },
  blob3: {
    width: 100,
    height: 180,
    bottom: 200,
    left: 40,
  },
  blob4: {
    width: 90,
    height: 140,
    bottom: 150,
    right: -10,
  },
  touchBlob: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    pointerEvents: 'none',
  },
  content: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A6A6A',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2D2D2D',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: '#4A4A4A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkText: {
    color: '#6A6A6A',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  modalGradient: {
    padding: 24,
    position: 'relative',
  },
  modalDecorBlob1: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '25deg' }],
  },
  modalDecorBlob2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '-15deg' }],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guestIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A4A4A',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6A6A6A',
    fontWeight: '700',
  },
  modalContent: {
    marginBottom: 28,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  warningIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CC7A00',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5A00',
    lineHeight: 20,
  },
  limitationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  withoutAccountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 14,
  },
  bulletPoints: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginRight: 12,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#6A6A6A',
    lineHeight: 22,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  encouragementIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
    marginTop: 1,
  },
  encouragementText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#6A6A6A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: '#6A6A6A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  continueButton: {
    flex: 1.2,
    backgroundColor: '#2D2D2D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
