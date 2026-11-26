package app.lumo.launcher;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.format.DateFormat;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

/**
 * Lumo: launcher mínimo para proyectores Android.
 * Sin servicios, sin widgets, sin animaciones, sin fondo de pantalla, sin red.
 * Solo trabaja mientras está en pantalla: al abrir otra app no consume nada.
 */
public class Main extends Activity {

    static final int ACCENT = 0xFFFFB547;
    static final int TILE = 0xFF17171E;
    static final int MUTED = 0xFF8C8AA0;

    final List<App> apps = new ArrayList<>();
    final Handler ui = new Handler(Looper.getMainLooper());
    SharedPreferences prefs;
    GridView grid;
    Adapter adapter;
    TextView clock, memory;
    boolean loading;

    static class App {
        String pkg, cls, label;
        Drawable banner, icon;
        int uses;
        boolean pinned;
    }

    // ------------------------------------------------------------------ ciclo de vida
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("lumo", MODE_PRIVATE);
        setContentView(buildUi());
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED);
        f.addAction(Intent.ACTION_PACKAGE_REMOVED);
        f.addAction(Intent.ACTION_PACKAGE_CHANGED);
        f.addDataScheme("package");
        registerReceiver(packages, f);
        loadApps();
    }

    @Override
    protected void onResume() {
        super.onResume();
        tick.run();
    }

    @Override
    protected void onPause() {
        super.onPause();
        ui.removeCallbacks(tick); // nada corre en segundo plano
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(packages);
        super.onDestroy();
    }

    @Override
    public void onBackPressed() { /* es la pantalla de inicio: no salir */ }

    final BroadcastReceiver packages = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) { loadApps(); }
    };

    final Runnable tick = new Runnable() {
        @Override
        public void run() {
            clock.setText(DateFormat.getTimeFormat(Main.this).format(new Date()));
            memory.setText(memoryText());
            ui.postDelayed(this, 30000);
        }
    };

    // ------------------------------------------------------------------ interfaz
    int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.BLACK);
        root.setPadding(dp(48), dp(28), dp(48), dp(16));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        clock = text(34, Color.WHITE, true);
        top.addView(clock);
        memory = text(14, MUTED, false);
        memory.setPadding(dp(20), 0, 0, 0);
        LinearLayout.LayoutParams grow = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        top.addView(memory, grow);
        top.addView(button("Liberar memoria", new View.OnClickListener() {
            public void onClick(View v) { freeMemory(); }
        }));
        top.addView(button("Wi-Fi", new View.OnClickListener() {
            public void onClick(View v) { open(new Intent(Settings.ACTION_WIFI_SETTINGS)); }
        }));
        top.addView(button("Ajustes", new View.OnClickListener() {
            public void onClick(View v) { open(new Intent(Settings.ACTION_SETTINGS)); }
        }));
        root.addView(top);

        grid = new GridView(this);
        grid.setNumColumns(GridView.AUTO_FIT);
        grid.setColumnWidth(dp(176));
        grid.setStretchMode(GridView.STRETCH_COLUMN_WIDTH);
        grid.setHorizontalSpacing(dp(16));
        grid.setVerticalSpacing(dp(16));
        grid.setPadding(0, dp(24), 0, dp(24));
        grid.setClipToPadding(false);
        grid.setSelector(new ColorDrawable(Color.TRANSPARENT));
        grid.setDrawSelectorOnTop(false);
        grid.setVerticalScrollBarEnabled(false);
        grid.setFocusable(true);
        adapter = new Adapter();
        grid.setAdapter(adapter);
        grid.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> p, View v, int pos, long id) { launch(apps.get(pos)); }
        });
        grid.setOnItemLongClickListener(new AdapterView.OnItemLongClickListener() {
            public boolean onItemLongClick(AdapterView<?> p, View v, int pos, long id) { options(apps.get(pos)); return true; }
        });
        grid.setOnKeyListener(new View.OnKeyListener() {
            public boolean onKey(View v, int code, KeyEvent e) {
                // la tecla Menú del mando abre las opciones de la app enfocada
                if (code == KeyEvent.KEYCODE_MENU && e.getAction() == KeyEvent.ACTION_UP) {
                    int pos = grid.getSelectedItemPosition();
                    if (pos >= 0 && pos < apps.size()) options(apps.get(pos));
                    return true;
                }
                return false;
            }
        });
        // repinta el borde al moverse con la cruceta (sin animaciones)
        grid.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { refreshFocus(); }
            public void onNothingSelected(AdapterView<?> p) { refreshFocus(); }
        });
        grid.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            public void onFocusChange(View v, boolean has) { refreshFocus(); }
        });
        root.addView(grid, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        TextView hint = text(12, 0xFF55536A, false);
        hint.setText("OK abrir  ·  mantener OK o Menú: opciones  ·  las apps más usadas suben solas");
        root.addView(hint);
        return root;
    }

    TextView text(float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        t.setSingleLine(true);
        return t;
    }

    GradientDrawable box(int fill, int stroke) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(fill);
        g.setCornerRadius(dp(14));
        if (stroke != 0) g.setStroke(dp(3), stroke);
        return g;
    }

    TextView button(String label, View.OnClickListener l) {
        final TextView b = text(15, Color.WHITE, true);
        b.setText(label);
        b.setPadding(dp(18), dp(10), dp(18), dp(10));
        b.setFocusable(true);
        b.setClickable(true);
        b.setOnClickListener(l);
        b.setBackground(box(TILE, 0));
        b.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            public void onFocusChange(View v, boolean has) {
                b.setBackground(has ? box(ACCENT, 0) : box(TILE, 0));
                b.setTextColor(has ? 0xFF1A1205 : Color.WHITE);
            }
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.leftMargin = dp(10);
        b.setLayoutParams(lp);
        return b;
    }

    class Adapter extends BaseAdapter {
        public int getCount() { return apps.size(); }
        public Object getItem(int i) { return apps.get(i); }
        public long getItemId(int i) { return i; }

        public View getView(int i, View v, ViewGroup parent) {
            Tile t = v instanceof Tile ? (Tile) v : new Tile();
            t.bind(apps.get(i), i == grid.getSelectedItemPosition() && grid.hasFocus());
            return t;
        }
    }

    /** Baldosa: banner de TV si existe, si no icono + nombre. */
    class Tile extends LinearLayout {
        final ImageView image = new ImageView(Main.this);
        final TextView label = text(14, Color.WHITE, false);

        Tile() {
            super(Main.this);
            setOrientation(VERTICAL);
            setGravity(Gravity.CENTER);
            setPadding(dp(10), dp(10), dp(10), dp(10));
            setLayoutParams(new GridView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(116)));
            image.setScaleType(ImageView.ScaleType.FIT_CENTER);
            addView(image, new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, dp(6), 0, 0);
            addView(label);
        }

        void bind(App a, boolean focused) {
            image.setImageDrawable(a.banner != null ? a.banner : a.icon);
            label.setText(a.pinned ? "★ " + a.label : a.label);
            label.setVisibility(a.banner != null ? GONE : VISIBLE);
            setBackground(box(TILE, focused ? ACCENT : 0));
        }
    }

    void refreshFocus() {
        int sel = grid.getSelectedItemPosition();
        boolean has = grid.hasFocus();
        for (int c = 0; c < grid.getChildCount(); c++) {
            View v = grid.getChildAt(c);
            if (v instanceof Tile) {
                int pos = grid.getFirstVisiblePosition() + c;
                v.setBackground(box(TILE, has && pos == sel ? ACCENT : 0));
            }
        }
    }

    // ------------------------------------------------------------------ apps
    void loadApps() {
        if (loading) return;
        loading = true;
        new Thread(new Runnable() {
            public void run() {
                final List<App> list = queryApps();
                ui.post(new Runnable() {
                    public void run() {
                        apps.clear();
                        apps.addAll(list);
                        adapter.notifyDataSetChanged();
                        loading = false;
                        if (!grid.hasFocus()) grid.requestFocus();
                    }
                });
            }
        }).start();
    }

    List<App> queryApps() {
        PackageManager pm = getPackageManager();
        Map<String, App> byPkg = new HashMap<>();
        String[] cats = {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
        HashSet<String> pins = new HashSet<>(prefs.getStringSet("pins", new HashSet<String>()));
        for (String cat : cats) {
            Intent q = new Intent(Intent.ACTION_MAIN).addCategory(cat);
            for (ResolveInfo r : pm.queryIntentActivities(q, 0)) {
                ActivityInfo ai = r.activityInfo;
                if (ai.packageName.equals(getPackageName()) || byPkg.containsKey(ai.packageName)) continue;
                App a = new App();
                a.pkg = ai.packageName;
                a.cls = ai.name;
                a.label = String.valueOf(r.loadLabel(pm));
                try {
                    a.banner = ai.loadBanner(pm);
                    if (a.banner == null) a.banner = ai.applicationInfo.loadBanner(pm);
                } catch (Exception ignored) { }
                if (a.banner == null) a.icon = r.loadIcon(pm);
                a.uses = prefs.getInt("u:" + a.pkg, 0);
                a.pinned = pins.contains(a.pkg);
                byPkg.put(a.pkg, a);
            }
        }
        List<App> list = new ArrayList<>(byPkg.values());
        Collections.sort(list, new Comparator<App>() {
            public int compare(App x, App y) {
                if (x.pinned != y.pinned) return x.pinned ? -1 : 1;
                if (x.uses != y.uses) return y.uses - x.uses;
                return x.label.compareToIgnoreCase(y.label);
            }
        });
        return list;
    }

    void launch(App a) {
        prefs.edit().putInt("u:" + a.pkg, a.uses + 1).apply();
        a.uses++;
        Intent i = new Intent(Intent.ACTION_MAIN).setClassName(a.pkg, a.cls)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        if (!open(i)) {
            Intent alt = getPackageManager().getLeanbackLaunchIntentForPackage(a.pkg);
            if (alt == null) alt = getPackageManager().getLaunchIntentForPackage(a.pkg);
            if (alt != null) open(alt.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        ui.postDelayed(new Runnable() { public void run() { loadApps(); } }, 1500); // reordena por uso
    }

    boolean open(Intent i) {
        try {
            startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            overridePendingTransition(0, 0);
            return true;
        } catch (Exception e) {
            Toast.makeText(this, "No se pudo abrir", Toast.LENGTH_SHORT).show();
            return false;
        }
    }

    void options(final App a) {
        String[] items = {a.pinned ? "Quitar de favoritos" : "Fijar al principio", "Información de la app", "Desinstalar", "Reiniciar contador de uso"};
        new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                .setTitle(a.label)
                .setItems(items, new android.content.DialogInterface.OnClickListener() { public void onClick(android.content.DialogInterface d, int which) {
                    if (which == 0) {
                        HashSet<String> pins = new HashSet<>(prefs.getStringSet("pins", new HashSet<String>()));
                        if (!pins.remove(a.pkg)) pins.add(a.pkg);
                        prefs.edit().putStringSet("pins", pins).apply();
                        loadApps();
                    } else if (which == 1) {
                        open(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + a.pkg)));
                    } else if (which == 2) {
                        open(new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + a.pkg)));
                    } else {
                        prefs.edit().remove("u:" + a.pkg).apply();
                        loadApps();
                    }
                }}).show();
    }

    // ------------------------------------------------------------------ memoria
    long availMb() {
        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        return mi.availMem / (1024 * 1024);
    }

    String memoryText() {
        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        return "RAM libre " + (mi.availMem >> 20) + " / " + (mi.totalMem >> 20) + " MB";
    }

    void freeMemory() {
        long before = availMb();
        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        PackageManager pm = getPackageManager();
        for (android.content.pm.ApplicationInfo ai : pm.getInstalledApplications(0)) {
            if (!ai.packageName.equals(getPackageName())) am.killBackgroundProcesses(ai.packageName);
        }
        System.gc();
        long freed = Math.max(0, availMb() - before);
        memory.setText(memoryText());
        Toast.makeText(this, "Liberados " + freed + " MB", Toast.LENGTH_SHORT).show();
    }
}
