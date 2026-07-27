import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import NourApp from "./src/NourApp";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  globalError: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      globalError: null,
    };
  }

  componentDidMount() {
    const g = globalThis as any;
    const defaultHandler = g.ErrorUtils?.getGlobalHandler?.();
    if (g.ErrorUtils?.setGlobalHandler) {
      g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        const errStr = error?.stack || error?.message || String(error);
        this.setState({
          hasError: true,
          globalError: `[Global Fatal JS Error]\n${errStr}`,
        });
        if (defaultHandler) {
          try {
            defaultHandler(error, isFatal);
          } catch (e) {
            // ignore
          }
        }
      });
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary Caught]", error, errorInfo);
  }

  handleShare = async () => {
    const errorText = this.getFormattedErrorText();
    try {
      const path = `${FileSystem.cacheDirectory}app_crash_log.txt`;
      await FileSystem.writeAsStringAsync(path, errorText);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "مشاركة تفاصيل الخطأ" });
      }
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  getFormattedErrorText(): string {
    const { error, errorInfo, globalError } = this.state;
    if (globalError) return globalError;
    let text = `[React Error Boundary]\n`;
    if (error) {
      text += `Name: ${error.name}\nMessage: ${error.message}\nStack:\n${error.stack}\n`;
    }
    if (errorInfo?.componentStack) {
      text += `\nComponent Stack:\n${errorInfo.componentStack}\n`;
    }
    return text;
  }

  render() {
    if (this.state.hasError) {
      const errorText = this.getFormattedErrorText();
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.headerTitle}>🚨 تم التقاط الخطأ (Crash Log)</Text>
            <Text style={styles.subtitle}>
              التطبيق واجه خطأ أثناء التشغيل. يسعدنا نسخ أو مشاركة هذا النص لحل المشكلة:
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              editable={false}
              selectTextOnFocus
              value={errorText}
            />

            <View style={styles.buttonRow}>
              <Pressable style={styles.shareButton} onPress={this.handleShare}>
                <Text style={styles.buttonText}>📤 مشاركة الخطأ</Text>
              </Pressable>
              <Pressable
                style={styles.retryButton}
                onPress={() => this.setState({ hasError: false, error: null, errorInfo: null, globalError: null })}
              >
                <Text style={styles.buttonText}>🔄 محاولة التشغيل</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#120000",
  },
  scroll: {
    padding: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5252",
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#E0E0E0",
    textAlign: "right",
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: "#2A0000",
    color: "#FFD700",
    borderWidth: 1,
    borderColor: "#FF5252",
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    minHeight: 300,
    maxHeight: 480,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  retryButton: {
    flex: 1,
    backgroundColor: "#388E3C",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default function App() {
  return (
    <GlobalErrorBoundary>
      <NourApp />
    </GlobalErrorBoundary>
  );
}
