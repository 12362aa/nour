# -*- coding: utf-8 -*-
import os

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Make WebView robust
import re
new_webview = """<WebView 
            source={{ uri: viewerUrl }} 
            style={{ flex: 1, backgroundColor: "transparent" }} 
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            renderLoading={() => <ActivityIndicator color={colors.gold} size="large" style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -18, marginTop: -18 }} />}
          />"""

code = re.sub(r'<WebView\s+source=\{\{ uri: viewerUrl \}\}\s+style=\{\{ flex: 1, backgroundColor: "transparent" \}\}\s+startInLoadingState=\{true\}\s+renderLoading=\{.*?\}\s+/>', new_webview, code, flags=re.DOTALL)

with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated WebView props")