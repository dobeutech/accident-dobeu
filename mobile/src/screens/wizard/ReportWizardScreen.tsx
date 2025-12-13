import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useReportStore } from '../../stores/reportStore';
import { LocationService } from '../../services/LocationService';
import { Colors, Shadows } from '../../theme/colors';
import { IncidentType, WizardStep } from '../../types';

// Wizard Step Components
import { Step1IncidentType } from './steps/Step1IncidentType';
import { Step2Location } from './steps/Step2Location';
import { Step3Photos } from './steps/Step3Photos';
import { Step4VehicleInfo } from './steps/Step4VehicleInfo';
import { Step5OtherParty } from './steps/Step5OtherParty';
import { Step6Witnesses } from './steps/Step6Witnesses';
import { Step7Statement } from './steps/Step7Statement';
import { Step8Signature } from './steps/Step8Signature';
import { Step9Review } from './steps/Step9Review';

type WizardRouteProp = RouteProp<RootStackParamList, 'ReportWizard'>;

const WIZARD_STEPS: WizardStep[] = [
  { id: 'incident', title: 'Incident Type', description: 'What happened?', icon: 'alert-circle', isComplete: false, isRequired: true },
  { id: 'location', title: 'Location', description: 'Where did it happen?', icon: 'location', isComplete: false, isRequired: true },
  { id: 'photos', title: 'Photos', description: 'Document the scene', icon: 'camera', isComplete: false, isRequired: false },
  { id: 'vehicle', title: 'Your Vehicle', description: 'Vehicle information', icon: 'car', isComplete: false, isRequired: true },
  { id: 'other_party', title: 'Other Party', description: 'Other vehicle/person', icon: 'people', isComplete: false, isRequired: false },
  { id: 'witnesses', title: 'Witnesses', description: 'Witness information', icon: 'person-add', isComplete: false, isRequired: false },
  { id: 'statement', title: 'Statement', description: 'Describe what happened', icon: 'document-text', isComplete: false, isRequired: true },
  { id: 'signature', title: 'Signature', description: 'Sign your report', icon: 'create', isComplete: false, isRequired: true },
  { id: 'review', title: 'Review', description: 'Review and submit', icon: 'checkmark-circle', isComplete: false, isRequired: true },
];

export function ReportWizardScreen() {
  const navigation = useNavigation();
  const route = useRoute<WizardRouteProp>();
  const { incidentType } = route.params || {};
  
  const {
    currentReport,
    currentStep,
    startNewReport,
    setCurrentStep,
    nextStep,
    prevStep,
    saveDraft,
    submitReport,
    cancelReport,
    setLocation,
  } = useReportStore();

  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);

  useEffect(() => {
    // Start a new report if we have an incident type and no current report
    if (incidentType && !currentReport) {
      startNewReport(incidentType as IncidentType);
      // Auto-capture location
      captureLocation();
    }
  }, [incidentType]);

  // Handle back button press
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentStep > 0) {
          prevStep();
          return true;
        }
        handleCancel();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [currentStep])
  );

  const captureLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setLocation(location);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Report?',
      'Do you want to save this as a draft or discard it?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Save Draft', 
          onPress: async () => {
            await saveDraft();
            navigation.goBack();
          }
        },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            cancelReport();
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as complete
      const updatedSteps = [...steps];
      updatedSteps[currentStep].isComplete = true;
      setSteps(updatedSteps);
      nextStep();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      prevStep();
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this report? You won\'t be able to edit it after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit',
          onPress: async () => {
            try {
              await submitReport();
              Alert.alert(
                'Report Submitted',
                'Your report has been submitted successfully.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to submit report. It has been saved as a draft.');
              navigation.goBack();
            }
          }
        },
      ]
    );
  };

  const handleStepPress = (index: number) => {
    // Allow jumping to completed steps or the next uncompleted step
    if (index <= currentStep || steps[index - 1]?.isComplete) {
      setCurrentStep(index);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1IncidentType />;
      case 1:
        return <Step2Location onRefreshLocation={captureLocation} />;
      case 2:
        return <Step3Photos />;
      case 3:
        return <Step4VehicleInfo />;
      case 4:
        return <Step5OtherParty />;
      case 5:
        return <Step6Witnesses />;
      case 6:
        return <Step7Statement />;
      case 7:
        return <Step8Signature />;
      case 8:
        return <Step9Review onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>
        <TouchableOpacity onPress={saveDraft} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Step Indicator */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsIndicator}
      >
        {steps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={styles.stepDot}
            onPress={() => handleStepPress(index)}
          >
            <View style={[
              styles.stepDotInner,
              index === currentStep && styles.stepDotActive,
              step.isComplete && styles.stepDotComplete,
            ]}>
              {step.isComplete ? (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              ) : (
                <Text style={[
                  styles.stepDotText,
                  index === currentStep && styles.stepDotTextActive,
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              index === currentStep && styles.stepLabelActive,
            ]} numberOfLines={1}>
              {step.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Step Header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons 
            name={currentStepData.icon as any} 
            size={24} 
            color={Colors.primary} 
          />
        </View>
        <View>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        </View>
        {currentStepData.isRequired && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        )}
      </View>

      {/* Step Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={handlePrev}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="arrow-back" 
            size={20} 
            color={currentStep === 0 ? Colors.grayMedium : Colors.primary} 
          />
          <Text style={[
            styles.navButtonText, 
            styles.navButtonTextSecondary,
            currentStep === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastStep ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.navButtonTextPrimary}>Submit Report</Text>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonTextPrimary}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.grayLight,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepsIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  stepDot: {
    alignItems: 'center',
    width: 60,
  },
  stepDotInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotComplete: {
    backgroundColor: Colors.success,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepDotTextActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    ...Shadows.small,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requiredBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  navButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.success,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextPrimary: {
    color: Colors.white,
  },
  navButtonTextSecondary: {
    color: Colors.primary,
  },
  navButtonTextDisabled: {
    color: Colors.grayMedium,
  },
});
