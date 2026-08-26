package com.ghostweb.browser;

import android.app.*;import android.os.*;import android.view.*;import android.webkit.*;import android.widget.*;import android.graphics.Color;import android.net.Uri;

public class MainActivity extends Activity {
 WebView web; EditText address; final String HOME="https://duckduckgo.com/";
 @Override public void onCreate(Bundle b){super.onCreate(b); getWindow().setStatusBarColor(Color.rgb(23,28,25));
  LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(16,20,18));
  LinearLayout bar=new LinearLayout(this);bar.setPadding(10,8,10,8);bar.setGravity(Gravity.CENTER_VERTICAL);
  Button back=btn("‹"),fwd=btn("›"),reload=btn("↻"),home=btn("⌂"); address=new EditText(this);address.setSingleLine(true);address.setText("ghostweb://home");address.setTextColor(Color.WHITE);address.setHintTextColor(Color.GRAY);address.setHint("Search or enter address");address.setBackgroundColor(Color.rgb(32,38,33));address.setPadding(12,0,12,0);
  bar.addView(back);bar.addView(fwd);bar.addView(reload);bar.addView(address,new LinearLayout.LayoutParams(0,48,1));bar.addView(home);root.addView(bar);
  web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setBuiltInZoomControls(false);s.setSafeBrowsingEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return false;}@Override public void onPageFinished(WebView v,String u){address.setText(u);}});
  web.setDownloadListener((url,userAgent,contentDisposition,mime,size)->{DownloadManager.Request r=new DownloadManager.Request(Uri.parse(url));r.setTitle(URLUtil.guessFileName(url,contentDisposition,mime));r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);((DownloadManager)getSystemService(DOWNLOAD_SERVICE)).enqueue(r);Toast.makeText(this,"Download started; Android security checks apply.",Toast.LENGTH_SHORT).show();});
  root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);web.loadUrl(HOME);
  address.setOnEditorActionListener((v,a,e)->{go(address.getText().toString());return true;});back.setOnClickListener(v->{if(web.canGoBack())web.goBack();});fwd.setOnClickListener(v->{if(web.canGoForward())web.goForward();});reload.setOnClickListener(v->web.reload());home.setOnClickListener(v->web.loadUrl(HOME));
 }
 Button btn(String t){Button b=new Button(this);b.setText(t);b.setTextColor(Color.WHITE);b.setMinWidth(45);return b;}
 void go(String q){q=q.trim();if(q.isEmpty())return; if(q.matches("(?i)https?://.*"))web.loadUrl(q);else web.loadUrl("https://duckduckgo.com/?q="+Uri.encode(q));}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
