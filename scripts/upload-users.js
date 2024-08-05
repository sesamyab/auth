const fs = require("fs");
const csv = require("csv-parser");

const token = "add token here";

async function getExistingUsers(lastUserId) {
  const per_page = 1;

  const url = new URL("http://auth2.sesamy.com/api/v2/users");
  url.searchParams.append("per_page", "1");
  url.searchParams.append("sort", "user_id:1");
  url.searchParams.append("include_totals", "false");

  if (lastUserId) {
    url.searchParams.append("q", `user_id:>${lastUserId}`);
  }

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "tenant-id": "A-bFAG1IGuW4vGQM3yhca",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch users. Status: ${response.status}, with error ${await response.text()}`,
    );
  }

  const body = await response.json();
  console.log(
    "Body: ",
    body.map((u) => u.user_id),
  );

  if (body.length === per_page) {
    const lastUser = body[body.length - 1];
    const lastUserId = lastUser.user_id;

    return [...body, ...(await getExistingUsers(lastUserId))];
  }

  return body;
}

function getProviderAndId(id) {
  const [provider, userId] = id.split("|");

  switch (provider) {
    case "google-oauth2":
      return {
        provider: "google-oauth2",
        connection: "google-oauth2",
        user_id: userId,
        is_social: true,
      };
    case "facebook":
      return {
        provider: "facebook",
        connection: "facebook",
        user_id: userId,
        is_social: true,
      };
    case "apple":
      return {
        provider: "apple",
        connection: "apple",
        user_id: userId,
        is_social: true,
      };
    case "email":
      return { provider: "email", connection: "email", user_id: userId };
    case "auth0":
      return {
        provider: "auth0",
        connection: "Username-Password-Authentication",
        user_id: userId,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function postUser(user) {
  const body = JSON.stringify({
    name: user["Address Name"],
    email: user.Email,
    nickname: user["Nickname"],
    picture: user.picture || "", // Assuming there's no picture field in CSV, add a default or handle it accordingly
    given_name: user["First Name"],
    family_name: user["Last name"],
    created_at: user["User creation date"],
    modified_at: user["User modified date"],
    ...getProviderAndId(user["User id"]),
  });

  const response = await fetch("http://localhost:8787/api/v2/users", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "tenant-id": "0DNqqRWQ1KsGzMNVu5qkY",
    },
    body,
  });

  if (!response.ok) {
    console.log(
      `Status: ${response.status}, with error ${await response.text()}`,
    );
  } else {
    console.log(`User: ${user["User id"]} posted successfully`);
  }
}

async function importUsers(filePath) {
  // const existingUsers = await getExistingUsers();

  const fileStream = fs.createReadStream(filePath);

  const users = [];

  fileStream
    .pipe(csv())
    .on("data", (data) => users.push(data))
    .on("end", async () => {
      for (const user of users) {
        try {
          await postUser(user);
        } catch (error) {
          console.error(
            `Failed to post user: ${user["User id"]}. Error: ${error.message}`,
          );
        }
      }
    });
}

importUsers("./data/fokus.csv");
