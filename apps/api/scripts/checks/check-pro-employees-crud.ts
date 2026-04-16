import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

async function main() {
  try {
    const auth = await loginPro();
    const suffix = uniqueSuffix();

    const createPayload = {
      displayName: "Employé CRUD Test",
      firstName: "Employé",
      lastName: "CRUD",
      roleLabel: "Assistant",
      email: `employee-crud-${suffix}@ambya.com`,
      phone: `+24107${suffix.slice(-7)}`,
    };

    const createResponse = await fetch(`${API_URL}/api/pro/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(
        `Employee create failed (${createResponse.status}) - ${JSON.stringify(createData)}`
      );
    }

    const employeeId = createData.id;
    if (!employeeId) {
      throw new Error("Employee create did not return an id");
    }

    const updatePayload = {
      displayName: "Employé CRUD Test Modifié",
      roleLabel: "Manager",
    };

    const updateResponse = await fetch(`${API_URL}/api/pro/employees/${employeeId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(
        `Employee update failed (${updateResponse.status}) - ${JSON.stringify(updateData)}`
      );
    }

    const deleteResponse = await fetch(`${API_URL}/api/pro/employees/${employeeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleteData = await deleteResponse.json();

    if (!deleteResponse.ok) {
      throw new Error(
        `Employee delete failed (${deleteResponse.status}) - ${JSON.stringify(deleteData)}`
      );
    }

    console.log("✅ PRO EMPLOYEES CRUD CHECK PASSED");
    console.log({
      createdId: createData.id,
      updatedName: updateData.displayName,
      finalStatus: deleteData.status,
      isActive: deleteData.isActive,
    });
  } catch (error) {
    console.error("❌ PRO EMPLOYEES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();