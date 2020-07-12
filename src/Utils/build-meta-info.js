import axios from 'axios';

const findBuildMetaVersion = async () => {
  try {
    let resp = await axios.get("/build-meta.json", {
      headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
      }
    });

    return resp.data;
  } catch {
    return {};
  }
}

export const checkIfLatestBundle = async () => {
  const meta = await findBuildMetaVersion();
  const clientMetaVersion = localStorage.getItem('build_meta_version');

  return [clientMetaVersion === meta.version, meta.version];
}