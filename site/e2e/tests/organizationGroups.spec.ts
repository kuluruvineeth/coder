import { expect, test } from "@playwright/test";
import {
	createGroup,
	createOrganization,
	createOrganizationMember,
	createUser,
	setupApiCalls,
} from "../api";
import { defaultOrganizationId, defaultOrganizationName } from "../constants";
import { expectUrl } from "../expectUrl";
import { login, randomName, requiresLicense } from "../helpers";
import { beforeCoderTest } from "../hooks";

test.beforeEach(async ({ page }) => {
	beforeCoderTest(page);
	await login(page);
	await setupApiCalls(page);
});

test("redirects", async ({ page }) => {
	requiresLicense();

	const orgName = defaultOrganizationName;
	await page.goto("/groups");
	await expectUrl(page).toHavePathName(`/organizations/${orgName}/groups`);

	await page.goto("/deployment/groups");
	await expectUrl(page).toHavePathName(`/organizations/${orgName}/groups`);
});

test("create group", async ({ page }) => {
	requiresLicense();

	// Create a new organization
	const org = await createOrganization();
	const orgUserAdmin = await createOrganizationMember({
		orgRoles: {
			[org.id]: ["organization-user-admin"],
		},
	});

	await login(page, orgUserAdmin);
	await page.goto(`/organizations/${org.name}`);

	// Navigate to groups page
	await page.getByRole("link", { name: "Groups" }).click();
	await expect(page).toHaveTitle("Groups - Coder");

	// Create a new group
	await page.getByText("Create group").click();
	await expect(page).toHaveTitle("Create Group - Coder");
	const name = randomName();
	await page.getByLabel("Name", { exact: true }).fill(name);
	const displayName = `Group ${name}`;
	await page.getByLabel("Display Name").fill(displayName);
	await page.getByLabel("Avatar URL").fill("/emojis/1f60d.png");
	await page.getByRole("button", { name: /save/i }).click();

	await expectUrl(page).toHavePathName(
		`/organizations/${org.name}/groups/${name}`,
	);
	await expect(page).toHaveTitle(`${displayName} - Coder`);
	await expect(page.getByText("No members yet")).toBeVisible();
	await expect(page.getByText(displayName)).toBeVisible();

	// Add a user to the group
	const personToAdd = await createUser(org.id);
	await page.getByPlaceholder("User email or username").fill(personToAdd.email);
	await page.getByRole("option", { name: personToAdd.email }).click();
	await page.getByRole("button", { name: "Add user" }).click();
	const addedRow = page.locator("tr", { hasText: personToAdd.email });
	await expect(addedRow).toBeVisible();

	// Ensure we can't add a user who isn't in the org
	const personToReject = await createUser(defaultOrganizationId);
	await page
		.getByPlaceholder("User email or username")
		.fill(personToReject.email);
	await expect(page.getByText("No users found")).toBeVisible();

	// Remove someone from the group
	await addedRow.getByRole("button", { name: "Open menu" }).click();
	const menu = page.getByRole("menu");
	await menu.getByText("Remove").click();

	await expect(addedRow).not.toBeVisible();

	// Delete the group
	await page.getByRole("button", { name: "Delete" }).click();
	const dialog = page.getByTestId("dialog");
	await dialog.getByLabel("Name of the group to delete").fill(name);
	await dialog.getByRole("button", { name: "Delete" }).click();
	await expect(page.getByText("Group deleted successfully.")).toBeVisible();

	await expectUrl(page).toHavePathName(`/organizations/${org.name}/groups`);
	await expect(page).toHaveTitle("Groups - Coder");
});

test("change quota settings", async ({ page }) => {
	requiresLicense();

	// Create a new organization and group
	const org = await createOrganization();
	const group = await createGroup(org.id);
	const orgUserAdmin = await createOrganizationMember({
		orgRoles: {
			[org.id]: ["organization-user-admin"],
		},
	});

	// Go to settings
	await login(page, orgUserAdmin);
	await page.goto(`/organizations/${org.name}/groups/${group.name}`);

	await page.getByRole("link", { name: "Settings", exact: true }).click();
	await expectUrl(page).toHavePathName(
		`/organizations/${org.name}/groups/${group.name}/settings`,
	);

	// Update Quota
	await page.getByLabel("Quota Allowance").fill("100");
	await page.getByRole("button", { name: /save/i }).click();

	// We should get sent back to the group page afterwards
	await expectUrl(page).toHavePathName(
		`/organizations/${org.name}/groups/${group.name}`,
	);

	// ...and that setting should persist if we go back
	await page.getByRole("link", { name: "Settings", exact: true }).click();
	await expect(page.getByLabel("Quota Allowance")).toHaveValue("100");
});
