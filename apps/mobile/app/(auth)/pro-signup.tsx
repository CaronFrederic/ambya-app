import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";

import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import {
  registerProfessional,
  type CountryCode,
  type RegisterProfessionalPayload,
} from "../../src/api/pro-registration";
import { verifyOtp, resendOtp } from "../../src/api/auth";
import { fetchMeLoyalty, fetchMeSummary } from "../../src/api/me";
import { useAuthRefresh } from "../../src/providers/AuthRefreshProvider";
import { colors, overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

type RegistrationStep =
  | "landing"
  | "step1"
  | "step2"
  | "step3"
  | "step4"
  | "success";

type TimeSlot = {
  start: string;
  end: string;
};

type DaySchedule = {
  isOpen: boolean;
  slots: TimeSlot[];
};

type ServiceType = "individual" | "group";
type LoginMethod = "phone" | "email";
type PaymentMethod = "mobile-money" | "bank";
type MobileMoneyOperator = "" | "airtel" | "moov" | "mtn" | "orange";

type GroupSettings = {
  maxCapacity: number;
  minCapacity?: number;
  alertThreshold?: number;
  cancellationPolicy: string;
  waitingList: boolean;
};

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  type: ServiceType;
  groupSettings?: GroupSettings;
};

type FormData = {
  establishmentName: string;
  establishmentType: string;
  customType: string;
  categories: string[];
  countryCode: CountryCode;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  district: string;
  customDistrict: string;

  schedule: Record<string, DaySchedule>;
  teamSize: number;
  workstations: number;

  services: Service[];

  loginMethod: LoginMethod;
  password: string;
  confirmPassword: string;

  paymentMethod: PaymentMethod;
  mobileMoneyOperator: MobileMoneyOperator;
  mobileMoneyNumber: string;

  depositEnabled: boolean;
  depositPercentage: number;

  acceptTerms: boolean;
  acceptNotifications: boolean;
  acceptNewsletter: boolean;
};

type StepBaseProps = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onNext: () => void;
  isValid: boolean;
};

type Step2Props = StepBaseProps & {
  copySchedule: (from: string, to: string[]) => void;
  addSlot: (day: string) => void;
  removeSlot: (day: string, index: number) => void;
  updateSlot: (
    day: string,
    index: number,
    field: "start" | "end",
    value: string,
  ) => void;
};

type Step3Props = {
  formData: FormData;
  services: Service[];
  onBack: () => void;
  onNext: () => void;
  isValid: boolean;
  addService: () => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  removeService: (id: string) => void;
  showCallbackModal: boolean;
  setShowCallbackModal: React.Dispatch<React.SetStateAction<boolean>>;
};

type Step4Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onComplete: () => void;
  isValid: boolean;
  passwordValidation: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
  passwordStrength: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  submitting: boolean;
};

type SuccessSectionProps = {
  phoneNumber: string;
  servicesCount: number;
  smsCode: string[];
  setSmsCode: React.Dispatch<React.SetStateAction<string[]>>;
  resendTimer: number;
  setResendTimer: React.Dispatch<React.SetStateAction<number>>;
  onResend: () => void;
  onVerifyOtp: () => void;
  verifyingOtp: boolean;
  resendingOtp: boolean;
  onGoDashboard: () => void;
};

const DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const CITIES: Record<CountryCode, string[]> = {
  "+241": [
    "Libreville",
    "Port-Gentil",
    "Franceville",
    "Oyem",
    "Moanda",
    "Mouila",
    "Lambaréné",
  ],
  "+243": [
    "Kinshasa",
    "Lubumbashi",
    "Goma",
    "Bukavu",
    "Kisangani",
    "Kananga",
    "Mbandaka",
  ],
  "+242": ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi"],
  "+237": ["Douala", "Yaoundé", "Garoua", "Bafoussam", "Bamenda"],
  "+225": ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro", "Korhogo"],
};

const DISTRICTS: Record<string, string[]> = {
  Libreville: [
    "Batterie IV",
    "Akanda",
    "Glass",
    "Nombakele",
    "Lalala",
    "Nzeng-Ayong",
    "Okala",
    "Plaine Orety",
    "Louis",
    "Petit Paris",
  ],
  Kinshasa: [
    "Gombe",
    "Ngaliema",
    "Limete",
    "Kintambo",
    "Kasavubu",
    "Bandalungwa",
    "Barumbu",
  ],
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function createDefaultSchedule(): Record<string, DaySchedule> {
  return {
    lundi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    mardi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    mercredi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    jeudi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    vendredi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    samedi: { isOpen: true, slots: [{ start: "08:00", end: "18:00" }] },
    dimanche: { isOpen: false, slots: [{ start: "08:00", end: "18:00" }] },
  };
}

function buildEmptyService(): Service {
  return {
    id: `service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    category: "",
    description: "",
    duration: "30",
    price: 0,
    type: "individual",
  };
}

export default function ProSignup() {
  const qc = useQueryClient();
  const { refreshAuth } = useAuthRefresh();

  const [step, setStep] = useState<RegistrationStep>("landing");
  const [submitting, setSubmitting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [smsCode, setSmsCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);

  const [formData, setFormData] = useState<FormData>({
    establishmentName: "",
    establishmentType: "",
    customType: "",
    categories: [],
    countryCode: "+241",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    district: "",
    customDistrict: "",

    schedule: createDefaultSchedule(),
    teamSize: 1,
    workstations: 1,

    services: [buildEmptyService()],

    loginMethod: "phone",
    password: "",
    confirmPassword: "",

    paymentMethod: "mobile-money",
    mobileMoneyOperator: "",
    mobileMoneyNumber: "",

    depositEnabled: false,
    depositPercentage: 30,

    acceptTerms: false,
    acceptNotifications: false,
    acceptNewsletter: false,
  });

  const passwordValidation = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordStrength = useMemo(() => {
    const checks = Object.values(passwordValidation).filter(Boolean).length;
    if (checks <= 1) return "Faible";
    if (checks === 2) return "Moyen";
    if (checks === 3) return "Bon";
    return "Fort";
  }, [passwordValidation]);

  const isStep1Valid = useMemo(() => {
    const districtValid =
      formData.district !== "" &&
      (formData.district !== "autre" ||
        formData.customDistrict.trim().length > 0);

    const typeValid =
      formData.establishmentType !== "" &&
      (formData.establishmentType !== "autre" ||
        formData.customType.trim().length > 0);

    const phoneValid = normalizePhone(formData.phoneNumber).length >= 9;
    const emailValid = isEmail(formData.email);
    const contactValid = phoneValid || emailValid;

    return (
      formData.establishmentName.trim().length >= 3 &&
      typeValid &&
      formData.categories.length > 0 &&
      contactValid &&
      formData.address.trim().length >= 10 &&
      formData.city !== "" &&
      districtValid
    );
  }, [formData]);

  const isStep2Valid = useMemo(() => {
    const hasOpenDay = Object.values(formData.schedule).some(
      (day) => day.isOpen,
    );
    return hasOpenDay && formData.teamSize > 0 && formData.workstations > 0;
  }, [formData.schedule, formData.teamSize, formData.workstations]);

  const isStep3Valid = useMemo(() => {
    return (
      formData.services.length > 0 &&
      formData.services.every(
        (service) =>
          service.name.trim().length >= 3 &&
          service.category !== "" &&
          service.price > 0,
      )
    );
  }, [formData.services]);

  const isStep4Valid = useMemo(() => {
    const phoneValid = normalizePhone(formData.phoneNumber).length >= 9;
    const emailValid = isEmail(formData.email);
    const loginOk = formData.loginMethod === "phone" ? phoneValid : emailValid;

    const depositOk = !formData.depositEnabled
      ? true
      : formData.depositPercentage >= 10 && formData.depositPercentage <= 100;

    return (
      loginOk &&
      passwordValidation.length &&
      passwordValidation.uppercase &&
      passwordValidation.number &&
      formData.password === formData.confirmPassword &&
      formData.acceptTerms &&
      formData.acceptNotifications &&
      depositOk
    );
  }, [formData, passwordValidation]);

  const stepIndex =
    step === "step1"
      ? 1
      : step === "step2"
        ? 2
        : step === "step3"
          ? 3
          : step === "step4"
            ? 4
            : 0;

  const onSubmit = async () => {
    const normalizedPhone = normalizePhone(formData.phoneNumber);
    const normalizedMobileMoneyNumber = normalizePhone(
      formData.mobileMoneyNumber,
    );

    const payload: RegisterProfessionalPayload = {
      establishmentName: formData.establishmentName.trim() || undefined,
      establishmentType: formData.establishmentType || undefined,
      customType: formData.customType.trim() || undefined,
      categories: formData.categories,

      countryCode: formData.countryCode,
      phone: normalizedPhone || undefined,
      email: formData.email.trim().toLowerCase() || undefined,

      address: formData.address.trim() || undefined,
      city: formData.city || undefined,
      district: formData.district || undefined,
      customDistrict: formData.customDistrict.trim() || undefined,

      schedule: formData.schedule,
      teamSize: formData.teamSize,
      workstations: formData.workstations,

      services: formData.services.map((service) => ({
        name: service.name.trim(),
        category: service.category,
        description: service.description.trim() || undefined,
        duration: service.duration,
        price: service.price,
        type: service.type,
        groupSettings: service.groupSettings,
      })),

      loginMethod: formData.loginMethod,
      password: formData.password,
      confirmPassword: formData.confirmPassword,

      paymentMethod: formData.paymentMethod,
      mobileMoneyOperator: formData.mobileMoneyOperator || undefined,
      mobileMoneyNumber: normalizedMobileMoneyNumber || undefined,

      depositEnabled: formData.depositEnabled,
      depositPercentage: formData.depositEnabled
        ? formData.depositPercentage
        : undefined,

      acceptTerms: formData.acceptTerms,
      acceptNotifications: formData.acceptNotifications,
      acceptNewsletter: formData.acceptNewsletter,

      salonName: formData.establishmentName.trim() || undefined,
    };

    try {
      setSubmitting(true);

      const data = await registerProfessional(payload);

      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("userRole", data.user.role);

      try {
        const summary = await fetchMeSummary();
        qc.setQueryData(["me", "summary"], summary);
      } catch {}

      try {
        const loyalty = await fetchMeLoyalty();
        qc.setQueryData(["me", "loyalty"], loyalty);
      } catch {}

      await refreshAuth();

      setSmsCode(["", "", "", "", "", ""]);
      setResendTimer(60);
      setStep("success");
    } catch (error: any) {
      console.log("registerProfessional error:", error);

      Alert.alert(
        "Inscription impossible",
        error?.message ||
          "Une erreur est survenue pendant la création du compte professionnel.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = smsCode.join("");

    if (code.length !== 6) {
      Alert.alert("Code invalide", "Veuillez saisir le code SMS à 6 chiffres.");
      return;
    }

    try {
      setVerifyingOtp(true);

      await verifyOtp({ code });

      await refreshAuth();

      Alert.alert("Succès", "Votre compte a bien été vérifié.");
      router.replace("/(professional)/dashboard");
    } catch (error: any) {
      console.log("verifyOtp error:", error);

      Alert.alert(
        "Validation impossible",
        error?.message || "Le code saisi est invalide ou expiré.",
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const resendSms = async () => {
    try {
      setResendingOtp(true);

      await resendOtp();

      setResendTimer(60);
      setSmsCode(["", "", "", "", "", ""]);

      Alert.alert("Code envoyé", "Un nouveau code SMS a été envoyé.");
    } catch (error: any) {
      console.log("resendOtp error:", error);

      Alert.alert(
        "Renvoi impossible",
        error?.message || "Impossible de renvoyer le code pour le moment.",
      );
    } finally {
      setResendingOtp(false);
    }
  };

  const copySchedule = (from: string, to: string[]) => {
    const source = formData.schedule[from];
    const next = { ...formData.schedule };

    to.forEach((day) => {
      next[day] = {
        isOpen: source.isOpen,
        slots: source.slots.map((slot) => ({ ...slot })),
      };
    });

    setFormData((prev) => ({ ...prev, schedule: next }));
  };

  const addSlot = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          slots: [
            ...prev.schedule[day].slots,
            { start: "09:00", end: "18:00" },
          ],
        },
      },
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setFormData((prev) => {
      const slots = prev.schedule[day].slots;
      if (slots.length <= 1) return prev;

      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            slots: slots.filter((_, i) => i !== index),
          },
        },
      };
    });
  };

  const updateSlot = (
    day: string,
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setFormData((prev) => {
      const slots = [...prev.schedule[day].slots];
      slots[index] = { ...slots[index], [field]: value };

      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            slots,
          },
        },
      };
    });
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, buildEmptyService()],
    }));
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service) =>
        service.id === id ? { ...service, ...updates } : service,
      ),
    }));
  };

  const removeService = (id: string) => {
    setFormData((prev) => {
      if (prev.services.length <= 1) return prev;

      return {
        ...prev,
        services: prev.services.filter((service) => service.id !== id),
      };
    });
  };

  if (step === "landing") {
    return (
      <Screen style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LandingSection onStart={() => setStep("step1")} />
        </ScrollView>
      </Screen>
    );
  }

  if (step === "success") {
    return (
      <Screen style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SuccessSection
            phoneNumber={`${formData.countryCode} ${normalizePhone(formData.phoneNumber)}`}
            servicesCount={formData.services.length}
            smsCode={smsCode}
            setSmsCode={setSmsCode}
            resendTimer={resendTimer}
            setResendTimer={setResendTimer}
            onResend={resendSms}
            onVerifyOtp={handleVerifyOtp}
            verifyingOtp={verifyingOtp}
            resendingOtp={resendingOtp}
            onGoDashboard={() => router.replace("/(professional)/dashboard")}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formShell}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>AMBYA</Text>
            <Text style={styles.duration}>Environ 10 minutes</Text>
          </View>

          <Text style={styles.mainTitle}>Rejoignez AMBYA</Text>
          <Text style={styles.mainSubtitle}>
            Créez votre profil professionnel en quelques minutes
          </Text>

          <ProgressHeader currentStep={stepIndex} />

          {step === "step1" ? (
            <Step1
              formData={formData}
              setFormData={setFormData}
              isValid={isStep1Valid}
              onBack={() => setStep("landing")}
              onNext={() => setStep("step2")}
            />
          ) : null}

          {step === "step2" ? (
            <Step2
              formData={formData}
              setFormData={setFormData}
              isValid={isStep2Valid}
              onBack={() => setStep("step1")}
              onNext={() => setStep("step3")}
              copySchedule={copySchedule}
              addSlot={addSlot}
              removeSlot={removeSlot}
              updateSlot={updateSlot}
            />
          ) : null}

          {step === "step3" ? (
            <Step3
              formData={formData}
              services={formData.services}
              isValid={isStep3Valid}
              onBack={() => setStep("step2")}
              onNext={() => setStep("step4")}
              addService={addService}
              updateService={updateService}
              removeService={removeService}
              showCallbackModal={showCallbackModal}
              setShowCallbackModal={setShowCallbackModal}
            />
          ) : null}

          {step === "step4" ? (
            <Step4
              formData={formData}
              setFormData={setFormData}
              isValid={isStep4Valid}
              passwordValidation={passwordValidation}
              passwordStrength={passwordStrength}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              setShowPassword={setShowPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              onBack={() => setStep("step3")}
              onComplete={onSubmit}
              submitting={submitting}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function LandingSection({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.landingWrap}>
      <Text style={styles.heroTitle}>Développez votre activité avec AMBYA</Text>
      <Text style={styles.heroSubtitle}>
        La plateforme n°1 de réservation en ligne pour les professionnels de la
        beauté, du bien-être et du fitness en Afrique Centrale
      </Text>

      <Button
        title="Créer mon compte gratuitement"
        onPress={onStart}
        style={styles.heroButton}
      />

      <View style={styles.statsGrid}>
        <StatCard value="50+" label="salons partenaires" icon="📍" />
        <StatCard value="10 000+" label="clients actifs" icon="👥" />
        <StatCard value="+15%" label="de CA additionnel en moyenne" icon="💰" />
      </View>

      <Card style={styles.landingCard}>
        <Text style={styles.sectionTitle}>Pourquoi rejoindre AMBYA ?</Text>
        <BenefitRow
          title="Visibilité accrue"
          desc="Soyez trouvé par des milliers de clients potentiels"
          icon="👁️"
        />
        <BenefitRow
          title="Gestion simplifiée"
          desc="Agenda, paiements, comptabilité en un seul endroit"
          icon="📊"
        />
        <BenefitRow
          title="Paiements sécurisés"
          desc="Recevez vos revenus via Mobile Money ou virement"
          icon="💳"
        />
        <BenefitRow
          title="Support 7j/7"
          desc="Accompagnement personnalisé en français"
          icon="🆘"
        />
      </Card>

      <Card style={styles.landingCtaCard}>
        <Text style={styles.landingCtaTitle}>
          Rejoignez AMBYA en 10 minutes
        </Text>
        <Text style={styles.landingCtaText}>
          Inscription simple et rapide, sans engagement
        </Text>
        <Pressable style={styles.goldButton} onPress={onStart}>
          <Text style={styles.goldButtonText}>Commencer maintenant</Text>
        </Pressable>
      </Card>
    </View>
  );
}

function ProgressHeader({ currentStep }: { currentStep: number }) {
  const labels = ["Informations", "Horaires", "Services", "Compte"];

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressRow}>
        {[1, 2, 3, 4].map((item, index) => {
          const isActive = currentStep === item;
          const isDone = currentStep > item;

          return (
            <React.Fragment key={item}>
              <View
                style={[
                  styles.progressCircle,
                  isActive && styles.progressCircleActive,
                  isDone && styles.progressCircleDone,
                ]}
              >
                <Text
                  style={[
                    styles.progressCircleText,
                    (isActive || isDone) && styles.progressCircleTextActive,
                  ]}
                >
                  {isDone ? "✓" : item}
                </Text>
              </View>

              {index < 3 ? (
                <View
                  style={[
                    styles.progressLine,
                    currentStep > item && styles.progressLineDone,
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.progressLabels}>
        {labels.map((label) => (
          <Text key={label} style={styles.progressLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Step1({
  formData,
  setFormData,
  onBack,
  onNext,
  isValid,
}: StepBaseProps) {
  const cities = CITIES[formData.countryCode];
  const districts = formData.city ? DISTRICTS[formData.city] ?? [] : [];

  const toggleCategory = (value: string) => {
    const exists = formData.categories.includes(value);
    setFormData((prev) => ({
      ...prev,
      categories: exists
        ? prev.categories.filter((item) => item !== value)
        : [...prev.categories, value],
    }));
  };

  return (
    <StepCard
      title="ÉTAPE 1/4 : INFORMATIONS DE L'ÉTABLISSEMENT"
      onBack={onBack}
      onNext={onNext}
      isValid={isValid}
    >
      <SectionTitle title="Informations de base" />

      <Input
        label="Nom de l'établissement *"
        placeholder="Ex: Beauty Salon Samira"
        value={formData.establishmentName}
        onChangeText={(value: string) =>
          setFormData((prev) => ({ ...prev, establishmentName: value }))
        }
        error={
          formData.establishmentName.length > 0 &&
          formData.establishmentName.trim().length < 3
            ? "Minimum 3 caractères requis"
            : undefined
        }
      />

      <FieldLabel label="Type d'établissement *" />
      <SelectChips
        value={formData.establishmentType}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, establishmentType: value }))
        }
        options={[
          { label: "💇 Salon de coiffure", value: "salon-coiffure" },
          { label: "💅 Institut de beauté", value: "institut-beaute" },
          { label: "🧖 Spa & Bien-être", value: "spa" },
          { label: "💪 Fitness", value: "fitness" },
          { label: "🧘 Yoga / Pilates", value: "yoga" },
          { label: "💆 Massage", value: "massage" },
          { label: "✂ Barbier", value: "barbier" },
          { label: "💅 Onglerie", value: "onglerie" },
          { label: "📚 Formation", value: "formation" },
          { label: "🏢 Autre", value: "autre" },
        ]}
      />

      {formData.establishmentType === "autre" ? (
        <Input
          label="Précisez le type *"
          placeholder="Votre type d'établissement"
          value={formData.customType}
          onChangeText={(value: string) =>
            setFormData((prev) => ({ ...prev, customType: value }))
          }
        />
      ) : null}

      <FieldLabel label="Catégories de services *" />
      <View style={styles.checkboxList}>
        {[
          { value: "beaute", label: "💅 Beauté" },
          { value: "fitness", label: "💪 Fitness" },
          { value: "bienetre", label: "🧘 Bien-être" },
          { value: "formation", label: "📚 Formation" },
        ].map((item) => {
          const checked = formData.categories.includes(item.value);

          return (
            <Pressable
              key={item.value}
              style={[styles.checkboxRow, checked && styles.checkboxRowActive]}
              onPress={() => toggleCategory(item.value)}
            >
              <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Coordonnées" />
      <InfoBox
        tone="info"
        text="Vous devez renseigner au moins un moyen de contact : numéro de téléphone OU adresse email."
      />

      <FieldLabel
        label="Numéro de téléphone principal"
        secondary="(optionnel si email renseigné)"
      />

      <View style={styles.row}>
        <View style={styles.codePicker}>
          <SelectChips
            value={formData.countryCode}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                countryCode: value as CountryCode,
                city: "",
                district: "",
                customDistrict: "",
              }))
            }
            options={[
              { label: "🇬🇦 +241", value: "+241" },
              { label: "🇨🇩 +243", value: "+243" },
              { label: "🇨🇬 +242", value: "+242" },
              { label: "🇨🇲 +237", value: "+237" },
              { label: "🇨🇮 +225", value: "+225" },
            ]}
          />
        </View>

        <View style={styles.flex1}>
          <Input
            placeholder="XX XX XX XX"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(value: string) =>
              setFormData((prev) => ({
                ...prev,
                phoneNumber: normalizePhone(value),
              }))
            }
            hint="Ce numéro sera visible par les clients pour vous contacter."
          />
        </View>
      </View>

      <Input
        label="Email professionnel"
        hint="Cet email servira aussi pour la connexion au compte."
        placeholder="contact@beautysalon.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(value: string) =>
          setFormData((prev) => ({ ...prev, email: value }))
        }
        error={
          formData.email.length > 0 && !isEmail(formData.email)
            ? "Format d'email invalide"
            : undefined
        }
      />

      <SectionTitle title="Localisation" />
      <Input
        label="Adresse complète *"
        placeholder="Ex: Quartier Batterie IV, Face Pharmacie du Rond Point, Libreville"
        multiline
        value={formData.address}
        onChangeText={(value: string) =>
          setFormData((prev) => ({ ...prev, address: value }))
        }
        inputStyle={{ minHeight: 84, textAlignVertical: "top" }}
        error={
          formData.address.length > 0 && formData.address.trim().length < 10
            ? "Minimum 10 caractères requis"
            : undefined
        }
      />

      <FieldLabel label="Ville *" />
      <SelectChips
        value={formData.city}
        onChange={(value) =>
          setFormData((prev) => ({
            ...prev,
            city: value,
            district: "",
            customDistrict: "",
          }))
        }
        options={cities.map((city: string) => ({ label: city, value: city }))}
      />

      <FieldLabel label="Quartier *" />
      <SelectChips
        value={formData.district}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, district: value }))
        }
        options={[
          ...districts.map((district: string) => ({
            label: district,
            value: district,
          })),
          { label: "Autre quartier", value: "autre" },
        ]}
      />

      {formData.district === "autre" ? (
        <Input
          label="Nom du quartier *"
          placeholder="Nom du quartier"
          value={formData.customDistrict}
          onChangeText={(value: string) =>
            setFormData((prev) => ({ ...prev, customDistrict: value }))
          }
        />
      ) : null}
    </StepCard>
  );
}

function Step2({
  formData,
  setFormData,
  onBack,
  onNext,
  isValid,
  copySchedule,
  addSlot,
  removeSlot,
  updateSlot,
}: Step2Props) {
  const [copyMessage, setCopyMessage] = useState("");

  const showCopyMessage = (message: string) => {
    setCopyMessage(message);
    setTimeout(() => setCopyMessage(""), 2000);
  };

  const handleCopyWeekdays = () => {
    copySchedule("lundi", ["mardi", "mercredi", "jeudi", "vendredi"]);
    showCopyMessage("Horaires copiés sur Mardi-Vendredi.");
  };

  const handleCopyAll = () => {
    copySchedule("lundi", [
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ]);
    showCopyMessage("Horaires copiés sur toute la semaine.");
  };

  return (
    <StepCard
      title="ÉTAPE 2/4 : HORAIRES & ÉQUIPE"
      onBack={onBack}
      onNext={onNext}
      isValid={isValid}
    >
      <SectionTitle title="Horaires d'ouverture" />

      <View style={styles.actionRow}>
        <Pressable style={styles.smallOutlinePill} onPress={handleCopyWeekdays}>
          <Text style={styles.smallOutlinePillText}>
            Copier lundi → Mardi-Vendredi
          </Text>
        </Pressable>
        <Pressable style={styles.smallOutlinePill} onPress={handleCopyAll}>
          <Text style={styles.smallOutlinePillText}>
            Appliquer à toute la semaine
          </Text>
        </Pressable>
      </View>

      {copyMessage ? <InfoBox tone="success" text={copyMessage} /> : null}

      {DAYS.map((day) => {
        const schedule = formData.schedule[day];

        return (
          <View
            key={day}
            style={[styles.dayCard, !schedule.isOpen && styles.dayCardClosed]}
          >
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderLeft}>
                <Switch
                  value={schedule.isOpen}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      schedule: {
                        ...prev.schedule,
                        [day]: {
                          ...prev.schedule[day],
                          isOpen: value,
                        },
                      },
                    }))
                  }
                  trackColor={{ false: colors.muted, true: overlays.brand30 }}
                  thumbColor={schedule.isOpen ? colors.brand : "#fff"}
                />
                <Text style={styles.dayTitle}>{DAY_LABELS[day]}</Text>
              </View>
            </View>

            {schedule.isOpen ? (
              <View style={{ gap: spacing.sm }}>
                {schedule.slots.map((slot, index) => (
                  <View key={`${day}-${index}`} style={styles.slotRow}>
                    <View style={styles.flex1}>
                      <Input
                        label="Début"
                        value={slot.start}
                        onChangeText={(value: string) =>
                          updateSlot(day, index, "start", value)
                        }
                        placeholder="08:00"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        label="Fin"
                        value={slot.end}
                        onChangeText={(value: string) =>
                          updateSlot(day, index, "end", value)
                        }
                        placeholder="18:00"
                      />
                    </View>
                    {schedule.slots.length > 1 ? (
                      <Pressable
                        style={styles.deleteMini}
                        onPress={() => removeSlot(day, index)}
                      >
                        <Text style={styles.deleteMiniText}>✕</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}

                <Pressable
                  style={styles.addSlotButton}
                  onPress={() => addSlot(day)}
                >
                  <Text style={styles.addSlotButtonText}>
                    + Ajouter une plage horaire
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.mutedText}>Jour de repos</Text>
            )}
          </View>
        );
      })}

      <InfoBox
        tone="info"
        text="Vous pourrez modifier ces horaires plus tard depuis le dashboard."
      />

      <SectionTitle title="Équipe & capacité" />

      <CounterField
        label="Nombre de professionnels dans votre équipe *"
        value={formData.teamSize}
        min={1}
        max={50}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, teamSize: value }))
        }
      />

      <CounterField
        label="Nombre de postes de travail *"
        value={formData.workstations}
        min={1}
        max={100}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, workstations: value }))
        }
      />

      {formData.workstations < formData.teamSize ? (
        <InfoBox
          tone="warning"
          text="Vous avez plus de professionnels que de postes. Cela peut limiter votre capacité de réservation."
        />
      ) : (
        <InfoBox tone="success" text="Configuration cohérente." />
      )}

      <InfoBox
        tone="purple"
        text={`Avec ${formData.teamSize} professionnel(s) et ${formData.workstations} poste(s), vous pouvez servir jusqu'à ${formData.workstations} client(s) simultanément.`}
      />
    </StepCard>
  );
}

function Step3({
  services,
  onBack,
  onNext,
  isValid,
  addService,
  updateService,
  removeService,
  showCallbackModal,
  setShowCallbackModal,
  formData,
}: Step3Props) {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    services[0]?.id ?? null,
  );
  const [callbackMessage, setCallbackMessage] = useState("");

  return (
    <StepCard
      title="ÉTAPE 3/4 : VOS SERVICES"
      subtitle="Ajoutez les prestations que vous proposez à vos clients"
      onBack={onBack}
      onNext={onNext}
      isValid={isValid}
    >
      {services.map((service, index) => {
        const expanded = expandedServiceId === service.id;

        return (
          <View key={service.id} style={styles.serviceCard}>
            <Pressable
              style={styles.serviceHeader}
              onPress={() => setExpandedServiceId(expanded ? null : service.id)}
            >
              <Text style={styles.serviceHeaderTitle}>
                Service {index + 1}
              </Text>
              <Text style={styles.serviceChevron}>{expanded ? "▾" : "▸"}</Text>
            </Pressable>

            {expanded ? (
              <View style={styles.serviceBody}>
                <Input
                  label="Nom du service *"
                  placeholder="Ex: Coupe femme, Cours de Yoga Débutant"
                  value={service.name}
                  onChangeText={(value: string) =>
                    updateService(service.id, { name: value })
                  }
                />

                <FieldLabel label="Catégorie *" />
                <SelectChips
                  value={service.category}
                  onChange={(value) =>
                    updateService(service.id, { category: value })
                  }
                  options={[
                    { label: "Beauté", value: "beaute" },
                    { label: "Fitness", value: "fitness" },
                    { label: "Bien-être", value: "bienetre" },
                    { label: "Formation", value: "formation" },
                  ]}
                />

                <Input
                  label="Description"
                  placeholder="Description courte du service"
                  multiline
                  value={service.description}
                  onChangeText={(value: string) =>
                    updateService(service.id, { description: value })
                  }
                  inputStyle={{ minHeight: 84, textAlignVertical: "top" }}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Durée *"
                      placeholder="30"
                      keyboardType="numeric"
                      value={service.duration}
                      onChangeText={(value: string) =>
                        updateService(service.id, {
                          duration: normalizePhone(value),
                        })
                      }
                    />
                  </View>

                  <View style={styles.flex1}>
                    <Input
                      label="Prix (FCFA) *"
                      placeholder="10000"
                      keyboardType="numeric"
                      value={service.price ? String(service.price) : ""}
                      onChangeText={(value: string) =>
                        updateService(service.id, {
                          price: Number(normalizePhone(value) || "0"),
                        })
                      }
                    />
                  </View>
                </View>

                <FieldLabel label="Type de réservation *" />
                <SelectChips
                  value={service.type}
                  onChange={(value) => {
                    if (value === "group") {
                      updateService(service.id, {
                        type: "group",
                        groupSettings: {
                          maxCapacity: 12,
                          cancellationPolicy: "24h",
                          waitingList: false,
                        },
                      });
                    } else {
                      updateService(service.id, {
                        type: "individual",
                        groupSettings: undefined,
                      });
                    }
                  }}
                  options={[
                    { label: "👤 Service individuel", value: "individual" },
                    { label: "👥 Cours collectif", value: "group" },
                  ]}
                />

                {service.type === "group" && service.groupSettings ? (
                  <View style={styles.groupSettingsBox}>
                    <Input
                      label="Capacité maximum *"
                      keyboardType="numeric"
                      value={String(service.groupSettings.maxCapacity)}
                      onChangeText={(value: string) =>
                        updateService(service.id, {
                          groupSettings: {
                            ...service.groupSettings!,
                            maxCapacity: Number(normalizePhone(value) || "2"),
                          },
                        })
                      }
                    />

                    <Input
                      label="Capacité minimum"
                      keyboardType="numeric"
                      value={
                        service.groupSettings.minCapacity
                          ? String(service.groupSettings.minCapacity)
                          : ""
                      }
                      onChangeText={(value: string) =>
                        updateService(service.id, {
                          groupSettings: {
                            ...service.groupSettings!,
                            minCapacity: value
                              ? Number(normalizePhone(value))
                              : undefined,
                          },
                        })
                      }
                    />

                    <Input
                      label="Alerte places restantes"
                      keyboardType="numeric"
                      value={
                        service.groupSettings.alertThreshold
                          ? String(service.groupSettings.alertThreshold)
                          : ""
                      }
                      onChangeText={(value: string) =>
                        updateService(service.id, {
                          groupSettings: {
                            ...service.groupSettings!,
                            alertThreshold: value
                              ? Number(normalizePhone(value))
                              : undefined,
                          },
                        })
                      }
                    />

                    <FieldLabel label="Politique d'annulation *" />
                    <SelectChips
                      value={service.groupSettings.cancellationPolicy}
                      onChange={(value) =>
                        updateService(service.id, {
                          groupSettings: {
                            ...service.groupSettings!,
                            cancellationPolicy: value,
                          },
                        })
                      }
                      options={[
                        { label: "12h", value: "12h" },
                        { label: "24h", value: "24h" },
                        { label: "48h", value: "48h" },
                      ]}
                    />

                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>
                        Activer la liste d'attente
                      </Text>
                      <Switch
                        value={service.groupSettings.waitingList}
                        onValueChange={(value) =>
                          updateService(service.id, {
                            groupSettings: {
                              ...service.groupSettings!,
                              waitingList: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.muted, true: overlays.brand30 }}
                        thumbColor={
                          service.groupSettings.waitingList ? colors.brand : "#fff"
                        }
                      />
                    </View>
                  </View>
                ) : null}

                {services.length > 1 ? (
                  <Pressable
                    onPress={() => removeService(service.id)}
                    style={styles.removeServiceBtn}
                  >
                    <Text style={styles.removeServiceText}>
                      🗑 Supprimer ce service
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable style={styles.addServiceBtn} onPress={addService}>
        <Text style={styles.addServiceBtnText}>+ Ajouter un autre service</Text>
      </Pressable>

      <Card style={styles.supportCard}>
        <Text style={styles.supportTitle}>ACCOMPAGNEMENT GRATUIT AMBYA</Text>
        <Text style={styles.supportLine}>📞 WhatsApp : +241 XX XX XX XX</Text>
        <Text style={styles.supportLine}>📞 Téléphone : +241 XX XX XX XX</Text>
        <Text style={styles.supportLine}>📧 Email : support@ambya.com</Text>
        <Text style={styles.supportLine}>
          ✅ Création de votre catalogue de services
        </Text>
        <Text style={styles.supportLine}>
          ✅ Conseils sur les tarifs adaptés à votre zone
        </Text>
        <Text style={styles.supportLine}>
          ✅ Configuration des cours collectifs
        </Text>

        <Button
          title="Être rappelé par AMBYA"
          onPress={() => setShowCallbackModal(true)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Modal
        visible={showCallbackModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCallbackModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Demandez à être rappelé</Text>
            <Text style={styles.modalText}>
              Nous utiliserons le numéro {formData.countryCode}{" "}
              {normalizePhone(formData.phoneNumber) || "non renseigné"}.
            </Text>

            <Input
              label="Message (optionnel)"
              placeholder="Ex: J'ai besoin d'aide pour configurer mes cours collectifs"
              multiline
              value={callbackMessage}
              onChangeText={setCallbackMessage}
              inputStyle={{ minHeight: 90, textAlignVertical: "top" }}
            />

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setShowCallbackModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirmer"
                onPress={() => {
                  setShowCallbackModal(false);
                  Alert.alert(
                    "Demande envoyée",
                    "Un membre de l'équipe AMBYA vous rappellera selon les disponibilités.",
                  );
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </StepCard>
  );
}

function Step4({
  formData,
  setFormData,
  onBack,
  onComplete,
  isValid,
  passwordValidation,
  passwordStrength,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  submitting,
}: Step4Props) {
  return (
    <StepCard
      title="ÉTAPE 4/4 : COMPTE & SÉCURITÉ"
      subtitle="Dernière étape ! Sécurisez votre compte"
      onBack={onBack}
      onNext={onComplete}
      isValid={isValid}
      nextLabel={submitting ? "Création..." : "Créer mon compte"}
    >
      <SectionTitle title="Authentification" />

      <FieldLabel label="Choisissez comment vous souhaitez vous connecter à AMBYA" />
      <SelectChips
        value={formData.loginMethod}
        onChange={(value) =>
          setFormData((prev) => ({
            ...prev,
            loginMethod: value as LoginMethod,
          }))
        }
        options={[
          { label: "📱 Connexion par téléphone", value: "phone" },
          { label: "📧 Connexion par email", value: "email" },
        ]}
      />

      {formData.loginMethod === "phone" ? (
        <InfoBox
          tone="purple"
          text={`Le numéro utilisé pour la connexion sera : ${formData.countryCode} ${normalizePhone(formData.phoneNumber) || "non renseigné"}`}
        />
      ) : (
        <InfoBox
          tone="purple"
          text={`L'email utilisé pour la connexion sera : ${formData.email || "non renseigné"}`}
        />
      )}

      <PasswordField
        label="Créer un mot de passe *"
        value={formData.password}
        visible={showPassword}
        setVisible={setShowPassword}
        onChangeText={(value) =>
          setFormData((prev) => ({ ...prev, password: value }))
        }
      />

      <View style={styles.passwordChecks}>
        <PasswordCheck
          label="Au moins 8 caractères"
          ok={passwordValidation.length}
        />
        <PasswordCheck label="Une majuscule" ok={passwordValidation.uppercase} />
        <PasswordCheck label="Un chiffre" ok={passwordValidation.number} />
        <PasswordCheck
          label="Un caractère spécial (recommandé)"
          ok={passwordValidation.special}
        />
      </View>

      <InfoBox
        tone="info"
        text={`Force du mot de passe : ${passwordStrength}`}
      />

      <PasswordField
        label="Confirmer le mot de passe *"
        value={formData.confirmPassword}
        visible={showConfirmPassword}
        setVisible={setShowConfirmPassword}
        onChangeText={(value) =>
          setFormData((prev) => ({ ...prev, confirmPassword: value }))
        }
        error={
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword
            ? "Les mots de passe ne correspondent pas"
            : undefined
        }
      />

      <SectionTitle title="Mode de paiement (pour recevoir vos revenus)" />

      <SelectChips
        value={formData.paymentMethod}
        onChange={(value) =>
          setFormData((prev) => ({
            ...prev,
            paymentMethod: value as PaymentMethod,
          }))
        }
        options={[
          { label: "Mobile Money", value: "mobile-money" },
          { label: "Compte bancaire", value: "bank" },
        ]}
      />

      {formData.paymentMethod === "mobile-money" ? (
        <View style={{ gap: spacing.md }}>
          <FieldLabel label="Opérateur Mobile Money" />
          <SelectChips
            value={formData.mobileMoneyOperator}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                mobileMoneyOperator: value as MobileMoneyOperator,
              }))
            }
            options={[
              { label: "Airtel Money", value: "airtel" },
              { label: "Moov Money", value: "moov" },
              { label: "MTN Mobile Money", value: "mtn" },
              { label: "Orange Money", value: "orange" },
            ]}
          />

          <Input
            label="Numéro marchand"
            placeholder="Numéro marchand"
            keyboardType="phone-pad"
            value={formData.mobileMoneyNumber}
            onChangeText={(value: string) =>
              setFormData((prev) => ({
                ...prev,
                mobileMoneyNumber: normalizePhone(value),
              }))
            }
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activer l'acompte</Text>
            <Switch
              value={formData.depositEnabled}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  depositEnabled: value,
                }))
              }
              trackColor={{ false: colors.muted, true: overlays.brand30 }}
              thumbColor={formData.depositEnabled ? colors.brand : "#fff"}
            />
          </View>

          {formData.depositEnabled ? (
            <Input
              label="Pourcentage d'acompte"
              placeholder="30"
              keyboardType="numeric"
              value={String(formData.depositPercentage)}
              onChangeText={(value: string) =>
                setFormData((prev) => ({
                  ...prev,
                  depositPercentage: Number(normalizePhone(value) || "0"),
                }))
              }
              hint="Recommandé entre 10 et 50"
            />
          ) : null}

          <InfoBox
            tone="purple"
            text="Assurez-vous d'avoir un compte marchand Mobile Money. Vous pourrez corriger cette information plus tard dans votre dashboard."
          />
        </View>
      ) : (
        <InfoBox
          tone="info"
          text="Les coordonnées bancaires seront complétées ultérieurement dans votre dashboard."
        />
      )}

      <SectionTitle title="Documents justificatifs" />
      <InfoBox
        tone="warning"
        text="Version mobile v1 : l'upload natif des documents sera branché juste après avec le module de fichiers. Le parcours et l'API d'inscription sont déjà prêts."
      />

      <SectionTitle title="Acceptation conditions" />

      <CheckboxRow
        checked={formData.acceptTerms}
        label="J'accepte les Conditions Générales d'Utilisation et la Politique de Confidentialité d'AMBYA *"
        onToggle={() =>
          setFormData((prev) => ({
            ...prev,
            acceptTerms: !prev.acceptTerms,
          }))
        }
      />

      <CheckboxRow
        checked={formData.acceptNotifications}
        label="J'accepte de recevoir les notifications essentielles pour gérer mes réservations *"
        onToggle={() =>
          setFormData((prev) => ({
            ...prev,
            acceptNotifications: !prev.acceptNotifications,
          }))
        }
      />

      <CheckboxRow
        checked={formData.acceptNewsletter}
        label="Je souhaite recevoir les actualités et conseils AMBYA par email"
        onToggle={() =>
          setFormData((prev) => ({
            ...prev,
            acceptNewsletter: !prev.acceptNewsletter,
          }))
        }
      />
    </StepCard>
  );
}

function SuccessSection({
  phoneNumber,
  servicesCount,
  smsCode,
  setSmsCode,
  resendTimer,
  setResendTimer,
  onResend,
  onVerifyOtp,
  verifyingOtp,
  resendingOtp,
  onGoDashboard,
}: SuccessSectionProps) {
  React.useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer, setResendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    const clean = normalizePhone(value).slice(-1);
    const next = [...smsCode];
    next[index] = clean;
    setSmsCode(next);
  };

  const canValidate = smsCode.every((digit) => digit.length === 1);

  return (
    <View style={styles.successWrap}>
      <View style={styles.successBadge}>
        <Text style={styles.successBadgeText}>✓</Text>
      </View>

      <Text style={styles.successTitle}>FÉLICITATIONS !</Text>
      <Text style={styles.successSubtitle}>
        Votre compte AMBYA est créé avec succès !
      </Text>
      <Text style={styles.successText}>Bienvenue dans la communauté AMBYA</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>✅ Ce qui a été configuré</Text>
        <Text style={styles.summaryLine}>
          • Profil établissement configuré et enregistré
        </Text>
        <Text style={styles.summaryLine}>• Horaires d'ouverture définis</Text>
        <Text style={styles.summaryLine}>
          • Services enregistrés ({servicesCount})
        </Text>
        <Text style={styles.summaryLine}>
          • Code de vérification SMS envoyé avec succès
        </Text>
      </Card>

      <View style={styles.smsCard}>
        <Text style={styles.smsTitle}>Vérifiez votre téléphone</Text>
        <Text style={styles.smsText}>
          Un code de vérification à 6 chiffres a été envoyé au :
        </Text>
        <Text style={styles.smsNumber}>{phoneNumber}</Text>

        <Text style={[styles.smsText, { marginTop: spacing.lg }]}>
          Saisissez le code reçu :
        </Text>

        <View style={styles.otpRow}>
          {smsCode.map((digit, index) => (
            <TextInput
              key={index}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
            />
          ))}
        </View>

        <Button
          title={verifyingOtp ? "Validation..." : "Valider mon compte"}
          onPress={onVerifyOtp}
          disabled={!canValidate || verifyingOtp}
          style={{ marginTop: spacing.md }}
        />

        {resendTimer > 0 ? (
          <Text style={styles.smsHint}>
            Vous pourrez renvoyer un nouveau code après {resendTimer} secondes.
          </Text>
        ) : (
          <Pressable
            style={[
              styles.resendButton,
              resendingOtp && { opacity: 0.6 },
            ]}
            onPress={onResend}
            disabled={resendingOtp}
          >
            <Text style={styles.resendButtonText}>
              {resendingOtp ? "Envoi..." : "Renvoyer le code SMS"}
            </Text>
          </Pressable>
        )}
      </View>

      <Card style={styles.nextStepsCard}>
        <Text style={styles.sectionTitle}>Vos prochaines étapes</Text>
        <NextStepRow
          step="1"
          title="Vérifier votre téléphone par SMS"
          status="En cours"
        />
        <NextStepRow
          step="2"
          title="Compléter votre profil"
          status="Après connexion"
        />
        <NextStepRow
          step="3"
          title="Paramétrer votre agenda"
          status="Dashboard"
        />
        <NextStepRow
          step="4"
          title="Activer les notifications"
          status="Paramètres"
        />
        <NextStepRow
          step="5"
          title="Recevoir votre première réservation"
          status="Bientôt"
        />
      </Card>

      <Card style={styles.supportAfterCard}>
        <Text style={styles.supportTitle}>ACCOMPAGNEMENT AMBYA</Text>
        <Text style={styles.supportLine}>👥 Notre équipe est là pour vous</Text>
        <Text style={styles.supportLine}>📞 Support disponible 7j/7</Text>
        <Text style={styles.supportLine}>
          De 8h à 20h : +241 XX XX XX XX
        </Text>
      </Card>

      <View style={styles.successActions}>
        <Button
          title="Accéder au Dashboard"
          onPress={onGoDashboard}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function StepCard({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  isValid,
  nextLabel = "Continuer",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  isValid: boolean;
  nextLabel?: string;
}) {
  return (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeaderBox}>
        <Text style={styles.stepHeaderTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.stepHeaderSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={{ gap: spacing.md }}>{children}</View>

      <View style={styles.navRow}>
        <Button
          title="Retour"
          variant="outline"
          onPress={onBack}
          style={{ flex: 1 }}
        />
        <Button
          title={nextLabel}
          onPress={onNext}
          disabled={!isValid}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function BenefitRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <View style={styles.flex1}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionHeading}>{title}</Text>;
}

function FieldLabel({
  label,
  secondary,
}: {
  label: string;
  secondary?: string;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {secondary ? (
        <Text style={styles.fieldLabelSecondary}>{secondary}</Text>
      ) : null}
    </View>
  );
}

function InfoBox({
  tone,
  text,
}: {
  tone: "info" | "success" | "warning" | "purple";
  text: string;
}) {
  return (
    <View
      style={[
        styles.infoBox,
        tone === "info" && styles.infoBoxInfo,
        tone === "success" && styles.infoBoxSuccess,
        tone === "warning" && styles.infoBoxWarning,
        tone === "purple" && styles.infoBoxPurple,
      ]}
    >
      <Text
        style={[
          styles.infoBoxText,
          tone === "info" && styles.infoBoxTextInfo,
          tone === "success" && styles.infoBoxTextSuccess,
          tone === "warning" && styles.infoBoxTextWarning,
          tone === "purple" && styles.infoBoxTextPurple,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SelectChips({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CounterField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.counterBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.counterRow}>
        <Pressable
          style={styles.counterBtnSecondary}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.counterBtnSecondaryText}>−</Text>
        </Pressable>

        <View style={styles.counterValueBox}>
          <Text style={styles.counterValue}>{value}</Text>
        </View>

        <Pressable
          style={styles.counterBtnPrimary}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.counterBtnPrimaryText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.checkboxRow}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
      </View>
      <Text style={[styles.checkboxText, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

function PasswordField({
  label,
  value,
  visible,
  setVisible,
  onChangeText,
  error,
}: {
  label: string;
  value: string;
  visible: boolean;
  setVisible: (value: boolean) => void;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      error={error}
      right={
        <Pressable
          onPress={() => setVisible(!visible)}
          style={styles.passwordToggle}
        >
          <Text style={styles.passwordToggleText}>
            {visible ? "Masquer" : "Afficher"}
          </Text>
        </Pressable>
      }
    />
  );
}

function PasswordCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Text
      style={[
        styles.passwordCheckText,
        ok ? styles.passwordCheckOk : styles.passwordCheckOff,
      ]}
    >
      {ok ? "✓ " : "○ "}
      {label}
    </Text>
  );
}

function NextStepRow({
  step,
  title,
  status,
}: {
  step: string;
  title: string;
  status: string;
}) {
  return (
    <View style={styles.nextStepRow}>
      <Text style={styles.nextStepNumber}>{step}</Text>
      <View style={styles.flex1}>
        <Text style={styles.nextStepTitle}>{title}</Text>
      </View>
      <View style={styles.nextStepStatus}>
        <Text style={styles.nextStepStatusText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  formShell: {
    gap: spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brand: {
    color: colors.brand,
    fontSize: 28,
    fontWeight: "700",
  },

  duration: {
    color: colors.textMuted,
    ...typography.small,
  },

  mainTitle: {
    color: colors.brand,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },

  mainSubtitle: {
    color: colors.textMuted,
    textAlign: "center",
    ...typography.body,
  },

  progressWrap: {
    gap: spacing.sm,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircleActive: {
    backgroundColor: colors.brand,
  },

  progressCircleDone: {
    backgroundColor: colors.gold,
  },

  progressCircleText: {
    color: colors.textMuted,
    fontWeight: "700",
  },

  progressCircleTextActive: {
    color: colors.brandForeground,
  },

  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: colors.muted,
  },

  progressLineDone: {
    backgroundColor: colors.gold,
  },

  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },

  progressLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.textMuted,
    ...typography.small,
  },

  landingWrap: {
    gap: spacing.xl,
  },

  heroTitle: {
    color: colors.brand,
    fontSize: 36,
    lineHeight: 44,
    textAlign: "center",
    fontWeight: "800",
  },

  heroSubtitle: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 25,
  },

  heroButton: {
    alignSelf: "center",
    minWidth: 260,
  },

  statsGrid: {
    gap: spacing.md,
  },

  statCard: {
    alignItems: "center",
    padding: spacing.lg,
  },

  statIcon: {
    fontSize: 34,
    marginBottom: spacing.sm,
  },

  statValue: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: "800",
  },

  statLabel: {
    color: colors.textMuted,
    textAlign: "center",
  },

  landingCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },

  sectionTitle: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },

  benefitRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  benefitIcon: {
    fontSize: 26,
  },

  benefitTitle: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 16,
  },

  benefitDesc: {
    color: colors.textMuted,
    marginTop: 4,
  },

  landingCtaCard: {
    backgroundColor: colors.brand,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },

  landingCtaTitle: {
    color: colors.brandForeground,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },

  landingCtaText: {
    color: colors.brandForeground,
    opacity: 0.9,
    textAlign: "center",
  },

  goldButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

  goldButtonText: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 16,
  },

  stepCard: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  stepHeaderBox: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },

  stepHeaderTitle: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: "800",
  },

  stepHeaderSubtitle: {
    color: colors.textMuted,
  },

  sectionHeading: {
    color: colors.brand,
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.sm,
  },

  fieldLabel: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  fieldLabelSecondary: {
    color: colors.textMuted,
    fontSize: 13,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  chip: {
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },

  chipText: {
    color: colors.brand,
    fontWeight: "600",
  },

  chipTextActive: {
    color: colors.brandForeground,
  },

  checkboxList: {
    gap: spacing.sm,
  },

  checkboxRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  checkboxRowActive: {
    borderColor: colors.brand,
    backgroundColor: overlays.brand05,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: overlays.brand20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },

  checkboxTick: {
    color: colors.brandForeground,
    fontWeight: "800",
    fontSize: 12,
  },

  checkboxText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },

  infoBox: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },

  infoBoxInfo: {
    backgroundColor: "#EEF5FF",
    borderColor: "#C7DBFF",
  },

  infoBoxSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: "#B9E6C8",
  },

  infoBoxWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: "#F3E1A4",
  },

  infoBoxPurple: {
    backgroundColor: "#F4ECFF",
    borderColor: "#D8B9FF",
  },

  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
  },

  infoBoxTextInfo: {
    color: "#295AA6",
  },

  infoBoxTextSuccess: {
    color: colors.successText,
  },

  infoBoxTextWarning: {
    color: colors.warningText,
  },

  infoBoxTextPurple: {
    color: "#6B21A8",
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  codePicker: {
    width: 120,
  },

  flex1: {
    flex: 1,
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  smallOutlinePill: {
    borderWidth: 1.5,
    borderColor: overlays.brand20,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },

  smallOutlinePillText: {
    color: colors.brand,
    fontWeight: "600",
    fontSize: 13,
  },

  dayCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },

  dayCardClosed: {
    opacity: 0.7,
  },

  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  dayTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },

  slotRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },

  deleteMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteMiniText: {
    color: colors.dangerText,
    fontWeight: "700",
  },

  addSlotButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },

  addSlotButtonText: {
    color: colors.brand,
    fontWeight: "700",
  },

  mutedText: {
    color: colors.textMuted,
    fontStyle: "italic",
  },

  counterBox: {
    gap: spacing.sm,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  counterBtnSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  counterBtnSecondaryText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },

  counterBtnPrimary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },

  counterBtnPrimaryText: {
    color: colors.brandForeground,
    fontSize: 24,
    fontWeight: "700",
  },

  counterValueBox: {
    flex: 1,
    alignItems: "center",
  },

  counterValue: {
    color: colors.brand,
    fontSize: 30,
    fontWeight: "800",
  },

  serviceCard: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.xl,
    overflow: "hidden",
  },

  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  serviceHeaderTitle: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 18,
  },

  serviceChevron: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "700",
  },

  serviceBody: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.card,
  },

  groupSettingsBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D8B9FF",
    backgroundColor: "#F7F1FF",
    padding: spacing.md,
    gap: spacing.md,
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  toggleLabel: {
    color: colors.text,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.md,
  },

  removeServiceBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
  },

  removeServiceText: {
    color: colors.dangerText,
    fontWeight: "700",
  },

  addServiceBtn: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  addServiceBtnText: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 16,
  },

  supportCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  supportTitle: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 18,
  },

  supportLine: {
    color: colors.text,
    lineHeight: 22,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },

  modalCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },

  modalTitle: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 22,
  },

  modalText: {
    color: colors.textMuted,
    lineHeight: 22,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
  },

  passwordChecks: {
    gap: 6,
  },

  passwordCheckText: {
    fontSize: 14,
  },

  passwordCheckOk: {
    color: colors.successText,
  },

  passwordCheckOff: {
    color: colors.textMuted,
  },

  passwordToggle: {
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  passwordToggleText: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 12,
  },

  navRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  successWrap: {
    gap: spacing.lg,
  },

  successBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.gold,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  successBadgeText: {
    color: colors.brandForeground,
    fontSize: 44,
    fontWeight: "800",
  },

  successTitle: {
    color: colors.gold,
    textAlign: "center",
    fontSize: 34,
    fontWeight: "900",
  },

  successSubtitle: {
    color: colors.brand,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
  },

  successText: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 16,
  },

  summaryCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },

  summaryTitle: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "800",
  },

  summaryLine: {
    color: colors.text,
    lineHeight: 22,
  },

  smsCard: {
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },

  smsTitle: {
    color: colors.brandForeground,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
  },

  smsText: {
    color: colors.brandForeground,
    textAlign: "center",
    opacity: 0.95,
    lineHeight: 22,
  },

  smsNumber: {
    color: colors.gold,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.xs,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  otpInput: {
    width: 44,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: overlays.white10,
    backgroundColor: overlays.white10,
    color: colors.brandForeground,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
  },

  smsHint: {
    color: colors.brandForeground,
    opacity: 0.8,
    textAlign: "center",
    marginTop: spacing.md,
  },

  resendButton: {
    borderWidth: 1.5,
    borderColor: overlays.white10,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },

  resendButtonText: {
    color: colors.brandForeground,
    textAlign: "center",
    fontWeight: "700",
  },

  nextStepsCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  nextStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  nextStepNumber: {
    color: colors.brand,
    fontSize: 20,
    fontWeight: "800",
    width: 24,
    textAlign: "center",
  },

  nextStepTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },

  nextStepStatus: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  nextStepStatusText: {
    color: colors.brandForeground,
    fontWeight: "700",
    fontSize: 12,
  },

  supportAfterCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: "#F7F1FF",
    borderWidth: 1,
    borderColor: "#D8B9FF",
  },

  successActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});

