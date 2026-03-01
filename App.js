import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';

// --- 設定 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbxoc02ZVkc_70fuc_dyfA4KnNzEFRZnKeV-YnjyGIEczLYxdoTmkdcb9G7t9doFt4OG0A/exec";

// --- 共通コンポーネント ---
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const InputField = ({ 
  label, placeholder, multiline = false, flex = 1, keyboardType = 'default',
  value, onChangeText, error = false, required = false
}) => (
  <View style={[styles.inputContainer, { flex }]}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.requiredTag}>必須</Text>}
    </View>
    <TextInput
      style={[styles.input, multiline && styles.textArea, error && styles.inputError]}
      placeholder={placeholder}
      placeholderTextColor="#bbb"
      multiline={multiline}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
    />
    {error && <Text style={styles.errorText}>この項目は入力必須です</Text>}
  </View>
);

const DropdownSelector = ({ label, options, selectedValue, onSelect, error, required, flex = 1 }) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={[styles.inputContainer, { flex }]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredTag}>必須</Text>}
      </View>
      <TouchableOpacity 
        style={[styles.dropdownTrigger, error && styles.inputError]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.dropdownText, !selectedValue && { color: '#bbb' }]}>
          {selectedValue || "選択 ▼"}
        </Text>
      </TouchableOpacity>
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{label}を選択</Text></View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => { onSelect(item.toString()); setModalVisible(false); }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedValue === item.toString() && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const SelectButtons = ({ label, options, selectedValue, onSelect, error, required }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.requiredTag}>必須</Text>}
    </View>
    <View style={[styles.buttonRow, error && styles.inputError, { borderWidth: error ? 1 : 0, borderRadius: 8 }]}>
      {options.map((opt) => (
        <TouchableOpacity 
          key={opt}
          style={[styles.selectBtn, selectedValue === opt && styles.selectBtnActive]} 
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.selectBtnText, selectedValue === opt && styles.selectBtnTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const MultiSelectButtons = ({ label, options, selectedValues, onToggle, error, required }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.requiredTag}>必須</Text>}
    </View>
    <View style={[styles.buttonRow, error && styles.inputError, { borderWidth: error ? 1 : 0, borderRadius: 8 }]}>
      {options.map((opt) => {
        const isActive = selectedValues.includes(opt);
        return (
          <TouchableOpacity 
            key={opt}
            style={[styles.selectBtn, isActive && styles.selectBtnActive]} 
            onPress={() => onToggle(opt)}
          >
            <Text style={[styles.selectBtnText, isActive && styles.selectBtnTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// --- メインコンポーネント ---
export default function App() {
  const initialState = {
    name: '', kana: '', gender: '', bloodType: '',
    birthYear: '', birthMonth: '', birthDay: '', age: '', zodiac: '', 
    phone: '', address: '', domicile: '', height: '', weight: '',
    jobDay: '', jobNight: '', education: '', nightJobExp: '', 
    livingStatus: '', livingStatusCustom: '', language: [], languageCustom: '', 
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '', emergencyAddress: '',
    hireCondition: '', applyMethod: '', applyMethodCustom: '', introducer: '', 
    daysPerWeek: '', availableDays: [], workTime: '', workTimeCustom: '',
    debt: '', transport: '', transportCustom: '', tattoo: '', tattooDetail: ''
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isAgreed, setIsAgreed] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = 2026;
  const years = Array.from({ length: 61 }, (_, i) => (currentYear - 18 - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const zodiacOptions = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const updateField = (key, value) => {
    let newForm = { ...form, [key]: value };
    if (key === 'hireCondition') { newForm.workTime = ''; newForm.workTimeCustom = ''; }
    if (key === 'applyMethod' && !['紹介', 'WARPスタッフの紹介'].includes(value)) { newForm.introducer = ''; }
    setForm(newForm);
    if (value && value.toString().trim() !== '') {
      setErrors(prev => ({ ...prev, [key]: false }));
    }
    setSubmitError("");
  };

  const toggleMulti = (key, val) => {
    let list = [...form[key]];
    if (list.includes(val)) { list = list.filter(v => v !== val); } 
    else { list.push(val); }
    updateField(key, list);
  };

  const handleViewSubmit = async () => {
    setSubmitError("");
    let newErrors = {};
    const requiredList = [
      'name', 'kana', 'gender', 'bloodType', 'birthYear', 'birthMonth', 'birthDay', 'age', 'zodiac', 
      'phone', 'address', 'domicile', 'jobDay', 'jobNight', 'education', 'nightJobExp', 'livingStatus', 
      'emergencyName', 'emergencyRelationship', 'emergencyPhone', 'emergencyAddress',
      'hireCondition', 'applyMethod', 'daysPerWeek', 'workTime'
    ];

    requiredList.forEach(key => {
      if (!form[key] || form[key].toString().trim() === '') newErrors[key] = true;
    });

    if (form.language.length === 0) newErrors.language = true;
    if (form.availableDays.length === 0) newErrors.availableDays = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("入力不備があります。赤枠を確認してください。");
      return;
    }
    if (!isAgreed) { setSubmitError("同意をオンにしてください。"); return; }

    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // プリフライト回避
        body: JSON.stringify(form),
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.status === 'success') {
        setIsSubmitted(true);
      } else {
        throw new Error(result.message || "送信エラー");
      }
    } catch (e) {
      setSubmitError("送信エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>送信が完了しました</Text>
          <Text style={styles.successText}>
            エントリーシートの送信ありがとうございます。{"\n"}内容を確認次第、担当よりご連絡いたします。
          </Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => { setForm(initialState); setIsSubmitted(false); setIsAgreed(false); }}>
            <Text style={styles.submitButtonText}>トップに戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.header}><Text style={styles.headerTitle}>面接エントリーシート</Text></View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Section title="基本情報">
            <InputField label="お名前" placeholder="例：山田 花子" required value={form.name} onChangeText={(v) => updateField('name', v)} error={errors.name} />
            <InputField label="かな" placeholder="例：やまだ はなこ" required value={form.kana} onChangeText={(v) => updateField('kana', v)} error={errors.kana} />
            <View style={styles.row}>
              <SelectButtons label="性別" options={['男性', '女性']} required selectedValue={form.gender} onSelect={(v) => updateField('gender', v)} error={errors.gender} />
              <View style={{ width: 10 }} />
              <SelectButtons label="血液型" options={['A型', 'B型', 'O型', 'AB型']} required selectedValue={form.bloodType} onSelect={(v) => updateField('bloodType', v)} error={errors.bloodType} />
            </View>
            <View style={styles.labelRow}><Text style={styles.label}>生年月日</Text><Text style={styles.requiredTag}>必須</Text></View>
            <View style={styles.row}>
              <DropdownSelector options={years} selectedValue={form.birthYear} onSelect={(v) => updateField('birthYear', v)} error={errors.birthYear} label="年" />
              <View style={{ width: 5 }} /><DropdownSelector options={months} selectedValue={form.birthMonth} onSelect={(v) => updateField('birthMonth', v)} error={errors.birthMonth} label="月" />
              <View style={{ width: 5 }} /><DropdownSelector options={days} selectedValue={form.birthDay} onSelect={(v) => updateField('birthDay', v)} error={errors.birthDay} label="日" />
            </View>
            <View style={styles.row}>
              <InputField label="年齢" placeholder="例：25" required keyboardType="numeric" value={form.age} onChangeText={(v) => updateField('age', v)} error={errors.age} flex={1} />
              <View style={{ width: 10 }} /><DropdownSelector label="干支" options={zodiacOptions} required selectedValue={form.zodiac} onSelect={(v) => updateField('zodiac', v)} error={errors.zodiac} flex={1.5} />
            </View>
            <InputField label="携帯番号" placeholder="09012345678" keyboardType="phone-pad" required value={form.phone} onChangeText={(v) => updateField('phone', v)} error={errors.phone} />
            <InputField label="現住所" placeholder="住所" multiline required value={form.address} onChangeText={(v) => updateField('address', v)} error={errors.address} />
            <InputField label="本籍地" placeholder="都道府県から" required value={form.domicile} onChangeText={(v) => updateField('domicile', v)} error={errors.domicile} />
          </Section>

          <Section title="勤務条件">
            <SelectButtons label="採用条件" options={['社員', 'アルバイト']} required selectedValue={form.hireCondition} onSelect={(v) => updateField('hireCondition', v)} error={errors.hireCondition} />
            <SelectButtons label="応募方法" options={['紹介', 'WARPスタッフの紹介', '求人広告', 'その他']} required selectedValue={form.applyMethod} onSelect={(v) => updateField('applyMethod', v)} error={errors.applyMethod} />
            {['紹介', 'WARPスタッフの紹介'].includes(form.applyMethod) && <InputField label="紹介者名" required value={form.introducer} onChangeText={(v) => updateField('introducer', v)} error={errors.introducer} />}
            <SelectButtons label="週何回入れますか" options={['ほぼ毎日', '週4-5', '週2-3', '週0-1']} required selectedValue={form.daysPerWeek} onSelect={(v) => updateField('daysPerWeek', v)} error={errors.daysPerWeek} />
            <MultiSelectButtons label="何曜日入れますか" options={['月', '火', '水', '木', '金', '土', '日']} required selectedValues={form.availableDays} onToggle={(v) => toggleMulti('availableDays', v)} error={errors.availableDays} />
            {form.hireCondition !== '' && (
              <View style={styles.dynamicSection}>
                <Text style={styles.workTimeNotice}>{form.hireCondition === '社員' ? '※17時出勤' : '※19時出勤'}</Text>
                <SelectButtons label="勤務時間" options={['未定', 'ラストまで', 'その他']} required selectedValue={form.workTime} onSelect={(v) => updateField('workTime', v)} error={errors.workTime} />
              </Section>
            )}
          </Section>

          <View style={styles.consentCard}>
            <Text style={styles.consentText}>間違いありませんか？</Text>
            <Switch value={isAgreed} onValueChange={(v) => setIsAgreed(v)} trackColor={{ false: "#767577", true: "#34C759" }} />
          </View>

          <TouchableOpacity style={[styles.submitButton, (!isAgreed || loading) && styles.submitButtonDisabled]} onPress={handleViewSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>内容を確認して送信</Text>}
          </TouchableOpacity>
          {submitError !== "" && <View style={styles.errorBanner}><Text style={styles.errorBannerText}>⚠️ {submitError}</Text></View>}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { paddingVertical: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 30, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#007AFF', marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#007AFF', paddingLeft: 10 },
  inputContainer: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 13, color: '#555', fontWeight: '600' },
  requiredTag: { fontSize: 10, color: '#fff', backgroundColor: '#FF3B30', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#E5E7EB' },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  errorText: { color: '#FF3B30', fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  selectBtn: { minWidth: '45%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', margin: 2, flex: 1 },
  selectBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  selectBtnText: { fontSize: 11, color: '#555', fontWeight: '600' },
  selectBtnTextActive: { color: '#fff' },
  dropdownTrigger: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 48, justifyContent: 'center' },
  dropdownText: { fontSize: 14, color: '#333', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { fontSize: 16, color: '#333' },
  checkmark: { color: '#007AFF', fontWeight: 'bold' },
  workTimeNotice: { fontSize: 12, color: '#FF3B30', fontWeight: 'bold', marginBottom: 5 },
  consentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#34C759' },
  consentText: { flex: 1, fontSize: 13, color: '#333', fontWeight: '600' },
  submitButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#B0C4DE' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorBanner: { marginTop: 15, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30', alignItems: 'center' },
  errorBannerText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold' },
  successCard: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5, width: '100%' },
  successIcon: { fontSize: 60, marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  successText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
});
