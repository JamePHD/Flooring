import {
  getGroupsWithAttributes,
  getProductAttributes,
  createGroup,
  updateGroup,
  deleteGroup,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  setProductAttribute,
  CreateGroupInput,
  CreateAttributeInput,
  SetProductAttributeInput,
} from "../models/attributeModel";

// ─── Public ──────────────────────────────────────────────────

export async function handleGetTieredAttributes() {
  return await getGroupsWithAttributes();
}

export async function handleGetProductAttributes(productId: string) {
  if (!productId) throw { message: "Product ID is required", status: 400 };
  return await getProductAttributes(productId);
}

// ─── Admin: Groups ───────────────────────────────────────────

export async function handleCreateGroup(input: CreateGroupInput) {
  if (!input.name || !input.slug) {
    throw { message: "Name and slug are required", status: 400 };
  }
  return await createGroup(input);
}

export async function handleUpdateGroup(id: string, input: Partial<CreateGroupInput>) {
  if (!id) throw { message: "Group ID is required", status: 400 };
  return await updateGroup(id, input);
}

export async function handleDeleteGroup(id: string) {
  if (!id) throw { message: "Group ID is required", status: 400 };
  await deleteGroup(id);
}

// ─── Admin: Attributes ──────────────────────────────────────

export async function handleCreateAttribute(input: CreateAttributeInput) {
  if (!input.name || !input.slug || !input.group_id) {
    throw { message: "Name, slug, and group_id are required", status: 400 };
  }
  return await createAttribute(input);
}

export async function handleUpdateAttribute(id: string, input: Partial<CreateAttributeInput>) {
  if (!id) throw { message: "Attribute ID is required", status: 400 };
  return await updateAttribute(id, input);
}

export async function handleDeleteAttribute(id: string) {
  if (!id) throw { message: "Attribute ID is required", status: 400 };
  await deleteAttribute(id);
}

// ─── Admin: Product Attributes ──────────────────────────────

export async function handleSetProductAttribute(input: SetProductAttributeInput) {
  if (!input.product_id || !input.attribute_id || !input.value) {
    throw { message: "product_id, attribute_id, and value are required", status: 400 };
  }
  return await setProductAttribute(input);
}