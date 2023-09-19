const fs = require("fs");
const readline = require("readline");
const Papa = require("papaparse");

const tenantId = "qo0kCHUE8qAvpNPznuoRW";
const token =
  "eyJraWQiOiIwU0FfNWoyR0NqY1ltU3pQSFBVRHkiLCJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkZWZhdWx0Iiwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsInBlcm1pc3Npb25zIjpbInZhdWx0OmVudGl0bGVtZW50OnJlZ2lzdGVyIiwidmF1bHQ6ZW50aXRsZW1lbnQ6bWFuYWdlIiwidmF1bHQ6ZW50aXRsZW1lbnQtc2hhcmU6bWFuYWdlIiwidmF1bHQ6bGVhc2UtZXh0ZW5zaW9uOm1hbmFnZSIsInZhdWx0Om1hbmFnZSIsInZhdWx0OnJlZ2lzdGVyIiwidmF1bHQ6aW1wZXJzb25hdGUiLCJ0b2tlbjpyZWFkLWNsaWVudHMiLCJ0b2tlbjp3cml0ZS1jbGllbnRzIiwidG9rZW46cmVhZC1wZXJtaXNzaW9ucyIsInRva2VuOndyaXRlLXBlcm1pc3Npb25zIiwiY2F0YWxvZzpyZWFkIl0sInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTA4NzkxMDA0NjcxMDcyODE3Nzk0Iiwia2lkIjoiMFNBXzVqMkdDamNZbVN6UEhQVUR5IiwiaXNzIjoiaHR0cHM6Ly90b2tlbi5zZXNhbXkuZGV2LyIsImlhdCI6MTY5NTExNzI1NiwiZXhwIjoxNjk1MjAzNjU2fQ.PJifvYO7cnWZObearDefqYgWppk8oIlBBLKv-vXdspUV302dLEOZybesnWjZLA9SlxkMdl4nnxNFLcDVrcuPSnR1fqr73mnVULFx0agYe_pVN8D2oF53BiCM1kSwGsMHIE8HNwwWah5tpb2u5stwf974RnMj2F7TtBgFcAHsXw76J8XHfYlDUU5S3_LgAKsVKkL86UWAOGjn2bNfNQTzl7nGPqqtOiAtBRCbl3MoOmBA85FkPN0pkwTfriPiFkv6-XL3y15ssCxPPo9eArfBUC9-VTqZrHGBUg9yujFmIx_dyffOYcX51Xy4ExErDg76sB_WzarpfQnGk2fS1RdnXKlfphmDhj2orjllh8XElEdCBkpZBPNgz5h7LraiV9PCHNwBHwkRX4c9fOR_G61ZLMG2dnqNdx3JkGGzOAxNqTBjU_e0XPNfxcBdgc6GC_7f7oXd8cNdMZIL70GLB7UoM4GA3WdrktgaxyuQ9IHxAFaIuQPkwK6KGkd8glTTjIHCu4x2HiPRa1sCisCTdgGBNc0xbj3PCHhzIluQXQCZ1DLIHQluUbMrz3WUWAaKeANndoaVN2gUmTXseItJehNeiKFWC3wK8T1P4jqXtq0LZ-5gzA_TL7tR4M2RA8QUgnjddmhyxEtqProXsdymzb2KRmzpQAHHKyrRSp5VTVS1LY0";
const apiUrl = "https://auth2.sesamy.dev";

async function postUser(user) {
  const body = JSON.stringify({
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    picture: user.picture,
    tags: [],
    given_name: user.given_name,
    family_name: user.family_name,
    id: user.user_id,
    created_at: user.created_at,
    modified_at: user.updated_at,
  });

  const response = await fetch(`${apiUrl}/api/v2/users`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "tenant-id": tenantId,
    },
    body,
  });

  if (!response.ok) {
    console.log(
      `Status: ${response.status}, with error ${await response.text()}`,
    );
  } else {
    console.log(`User: ${user.id}: ${response.status}`);
  }
}

function getCsvUsers(filePath) {
  const csvString = fs.readFileSync(filePath, "utf8");

  const { data } = Papa.parse(csvString, {
    header: true,
  });

  return data.map((user) => ({
    name: user.full_name,
    email: user.email,
    tags: [],

    id: user.id,
    created_at: user.created_at,
  }));
}

async function importUsers(filePath) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // so it can handle even `\r\n` ending lines correctly
  });

  let counter = 0;

  for await (const line of rl) {
    try {
      const user = JSON.parse(line);

      await postUser(user);
    } catch (error) {
      console.error(`Failed to parse line: ${line}. Error: ${error.message}`);
    }
  }
}

async function importUsersFromCsv(file) {
  const users = getCsvUsers(file);

  for await (const user of users) {
    try {
      await postUser(user);
    } catch (error) {
      console.error(`Failed to parse line: ${user}. Error: ${error.message}`);
    }
  }
}

importUsers("./data/auth0-dev.json");
// importUsersFromCsv("./data/kvartal-auth0.csv");
