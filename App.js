import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'https://api.alquran.cloud/v1';

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [error, setError] = useState('');

  const loadSurahs = useCallback(async () => {
    try {
      setError('');
      setLoadingSurahs(true);
      const response = await fetch(`${API_BASE_URL}/surah`);

      if (!response.ok) {
        throw new Error('تعذر جلب قائمة السور.');
      }

      const payload = await response.json();
      setSurahs(payload.data ?? []);
    } catch (fetchError) {
      setError(fetchError.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoadingSurahs(false);
    }
  }, []);

  const loadAyahs = useCallback(async (surah) => {
    try {
      setError('');
      setSelectedSurah(surah);
      setLoadingAyahs(true);
      const response = await fetch(`${API_BASE_URL}/surah/${surah.number}/ar.alafasy`);

      if (!response.ok) {
        throw new Error('تعذر جلب آيات السورة.');
      }

      const payload = await response.json();
      setAyahs(payload.data?.ayahs ?? []);
    } catch (fetchError) {
      setError(fetchError.message || 'حدث خطأ غير متوقع.');
      setAyahs([]);
    } finally {
      setLoadingAyahs(false);
    }
  }, []);

  useEffect(() => {
    loadSurahs();
  }, [loadSurahs]);

  const filteredSurahs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return surahs;
    }

    return surahs.filter((surah) => {
      return (
        surah.name?.includes(normalizedQuery) ||
        surah.englishName?.toLowerCase().includes(normalizedQuery) ||
        String(surah.number).includes(normalizedQuery)
      );
    });
  }, [query, surahs]);

  const renderSurah = ({ item }) => (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => loadAyahs(item)}
      style={[
        styles.surahCard,
        selectedSurah?.number === item.number && styles.selectedSurahCard,
      ]}
    >
      <View style={styles.surahNumberBadge}>
        <Text style={styles.surahNumber}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahName}>{item.name}</Text>
        <Text style={styles.surahMeta}>
          {item.englishName} • {item.numberOfAyahs} آية • {item.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAyah = ({ item }) => (
    <View style={styles.ayahCard}>
      <Text style={styles.ayahNumber}>﴿ {item.numberInSurah} ﴾</Text>
      <Text style={styles.ayahText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>تطبيق القرآن الكريم</Text>
        <Text style={styles.subtitle}>اقرأ السور والآيات مباشرة من واجهة API</Text>
      </View>

      {error ? (
        <TouchableOpacity style={styles.errorBox} onPress={selectedSurah ? () => loadAyahs(selectedSurah) : loadSurahs}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>اضغط لإعادة المحاولة</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.content}>
        <View style={styles.surahPanel}>
          <TextInput
            placeholder="ابحث باسم السورة أو رقمها"
            placeholderTextColor="#64748b"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />

          {loadingSurahs ? (
            <ActivityIndicator color="#0f766e" size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredSurahs}
              keyExtractor={(item) => String(item.number)}
              renderItem={renderSurah}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>لا توجد نتائج مطابقة.</Text>}
            />
          )}
        </View>

        <View style={styles.ayahPanel}>
          {selectedSurah ? (
            <>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedTitle}>{selectedSurah.name}</Text>
                <Text style={styles.selectedSubtitle}>
                  {selectedSurah.englishNameTranslation} • {selectedSurah.numberOfAyahs} آية
                </Text>
              </View>

              {loadingAyahs ? (
                <ActivityIndicator color="#0f766e" size="large" style={styles.loader} />
              ) : (
                <FlatList
                  data={ayahs}
                  keyExtractor={(item) => String(item.number)}
                  renderItem={renderAyah}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>☪</Text>
              <Text style={styles.emptyStateTitle}>اختر سورة للقراءة</Text>
              <Text style={styles.emptyStateText}>
                ستظهر الآيات هنا بعد اختيار السورة من القائمة.
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingBottom: 22,
    paddingTop: 54,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    color: '#ccfbf1',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'right',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderRadius: 14,
    borderWidth: 1,
    margin: 16,
    padding: 14,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 15,
    textAlign: 'right',
  },
  retryText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    gap: 14,
    padding: 16,
  },
  surahPanel: {
    flex: 1,
  },
  ayahPanel: {
    flex: 2,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  loader: {
    marginTop: 32,
  },
  surahCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    marginBottom: 10,
    padding: 14,
  },
  selectedSurahCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#0f766e',
  },
  surahNumberBadge: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 12,
    width: 40,
  },
  surahNumber: {
    color: '#115e59',
    fontWeight: '800',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
  },
  surahMeta: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
  },
  selectedHeader: {
    backgroundColor: '#134e4a',
    borderRadius: 22,
    marginBottom: 12,
    padding: 18,
  },
  selectedTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectedSubtitle: {
    color: '#99f6e4',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  ayahCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  ayahNumber: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  ayahText: {
    color: '#111827',
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateIcon: {
    color: '#0f766e',
    fontSize: 56,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
});
