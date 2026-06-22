import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!url) {
      setError('Tafadhali ingiza URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:3000/scan', {
        url: url
      });
      
      setResult(response.data);
    } catch (err) {
      setError('Imeshindwa kuunganisha na server. Hakikisha backend inaendesha.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'Salama': return '#4CAF50';
      case 'Tahadhari': return '#FF9800';
      case 'Hatari': return '#F44336';
      case 'Hatari Sana': return '#D32F2F';
      default: return '#333';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Angalia Kiungo</Text>
      <Text style={styles.subtitle}>Ingiza URL kuangalia kama ni salama</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="https://example.com"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScan}
          disabled={loading}
        >
          <Text style={styles.scanButtonText}>
            {loading ? 'Inachunguza...' : 'Chunguza'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Inachambua URL...</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Matokeo ya Uchunguzi</Text>
          
          <View style={[styles.scoreContainer, { backgroundColor: getRiskColor(result.riskLevel) }]}>
            <Text style={styles.scoreEmoji}>{result.emoji}</Text>
            <Text style={styles.scoreText}>{result.score}/100</Text>
            <Text style={styles.riskText}>{result.riskLevel}</Text>
          </View>

          <View style={styles.checksContainer}>
            <Text style={styles.checksTitle}>🔍 Checks:</Text>
            
            {result.checks && (
              <View>
                <CheckItem label="SSL" value={result.checks.ssl?.message || 'N/A'} />
                <CheckItem label="IP" value={result.checks.ip?.message || 'N/A'} />
                <CheckItem label="Typosquat" value={result.checks.typosquat?.message || 'N/A'} />
                <CheckItem label="Umri wa Domain" value={result.checks.domainAge?.message || 'N/A'} />
              </View>
            )}
          </View>

          {result.risks && result.risks.length > 0 && (
            <View style={styles.risksContainer}>
              <Text style={styles.risksTitle}>⚠️ Hatari Zilizogunduliwa:</Text>
              {result.risks.map((risk, index) => (
                <Text key={index} style={styles.riskItem}>• {risk}</Text>
              ))}
            </View>
          )}

          <Text style={styles.message}>{result.message}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const CheckItem = ({ label, value }) => {
  const isSafe = value.includes('✅');
  const isWarning = value.includes('⚠️');
  const isError = value.includes('❌') || value.includes('⏰');
  
  let color = '#333';
  if (isSafe) color = '#4CAF50';
  else if (isWarning) color = '#FF9800';
  else if (isError) color = '#F44336';

  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkLabel}>{label}:</Text>
      <Text style={[styles.checkValue, { color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  errorText: {
    color: '#D32F2F',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  scoreEmoji: {
    fontSize: 40,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  riskText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  checksContainer: {
    marginTop: 10,
  },
  checksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkLabel: {
    fontWeight: '600',
    color: '#555',
  },
  checkValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  risksContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  risksTitle: {
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  riskItem: {
    color: '#BF360C',
    marginLeft: 10,
    marginTop: 3,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
    color: '#333',
  },
});