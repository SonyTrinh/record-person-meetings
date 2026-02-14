const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const withIosBackgroundAudio = (config) =>
  withInfoPlist(config, (mod) => {
    const modes = ensureArray(mod.modResults.UIBackgroundModes);
    if (!modes.includes('audio')) {
      modes.push('audio');
    }

    mod.modResults.UIBackgroundModes = modes;
    mod.modResults.NSMicrophoneUsageDescription =
      mod.modResults.NSMicrophoneUsageDescription ??
      'This app records your in-person meetings.';

    return mod;
  });

const ensureAndroidPermission = (manifest, permissionName) => {
  const usesPermissions = ensureArray(manifest.manifest['uses-permission']);
  const exists = usesPermissions.some(
    (permission) => permission.$['android:name'] === permissionName
  );

  if (!exists) {
    usesPermissions.push({
      $: {
        'android:name': permissionName,
      },
    });
  }

  manifest.manifest['uses-permission'] = usesPermissions;
};

const withAndroidBackgroundAudio = (config) =>
  withAndroidManifest(config, (mod) => {
    ensureAndroidPermission(mod.modResults, 'android.permission.RECORD_AUDIO');
    ensureAndroidPermission(mod.modResults, 'android.permission.WAKE_LOCK');
    ensureAndroidPermission(mod.modResults, 'android.permission.FOREGROUND_SERVICE');
    ensureAndroidPermission(
      mod.modResults,
      'android.permission.FOREGROUND_SERVICE_MICROPHONE'
    );

    return mod;
  });

module.exports = function withBackgroundRecording(config) {
  config = withIosBackgroundAudio(config);
  config = withAndroidBackgroundAudio(config);
  return config;
};
