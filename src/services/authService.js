import { appConfig } from '../config';
import {
  clearSessionToken,
  clearSessionUser,
  createUser,
  findUserByEmail,
  loadSessionToken,
  loadSessionUser,
  loadUsers,
  saveSessionToken,
  saveSessionUser,
  updateUser,
} from '../utils/authStorage';
import { saveCart } from '../utils/cartStorage';

import cartService from './cartService';
import { requestJson } from './http';

const MIN_REGISTER_PASSWORD_LENGTH = 6;
const MIN_CHANGE_PASSWORD_LENGTH = 8;

const normalizeStatus = (status) => {
  const normalizedStatus = String(status ?? '')
    .trim()
    .toUpperCase();

  return normalizedStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
};

const normalizeRole = (role) => {
  const normalizedRole = String(role ?? '')
    .trim()
    .toUpperCase();

  return normalizedRole === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
};

const getFullName = (firstName, lastName, fallback = '') => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || String(fallback ?? '').trim();
};

const normalizeEmail = (email) =>
  String(email ?? '')
    .trim()
    .toLowerCase();

const toSessionUser = (user) => {
  if (!user) {
    return null;
  }

  const firstName = String(user.firstName ?? '').trim();
  const lastName = String(user.lastName ?? '').trim();
  const fullName = getFullName(firstName, lastName, user.fullName ?? user.name);

  return {
    id: user.id,
    firstName,
    lastName,
    fullName,
    name: fullName,
    email: user.email,
    role: normalizeRole(user.role),
    phone: String(user.phone ?? '').trim(),
    status: String(user.status ?? 'ACTIVE').trim() || 'ACTIVE',
    createdAt: String(user.createdAt ?? ''),
  };
};

const getErrorMessage = (error, fallback) =>
  error instanceof Error && error.message ? error.message : fallback;

const buildAdminUserPayload = (payload, { includePassword = false } = {}) => {
  const normalizedPayload = {
    email: normalizeEmail(payload?.email),
    firstName: String(payload?.firstName ?? '').trim(),
    lastName: String(payload?.lastName ?? '').trim(),
    phone: String(payload?.phone ?? '').trim(),
    role: normalizeRole(payload?.role),
    status: normalizeStatus(payload?.status),
  };

  if (includePassword) {
    normalizedPayload.password = String(payload?.password ?? '');
  }

  return normalizedPayload;
};

const validateAdminUserPayload = (payload, { isEditing = false, currentUserId = '' } = {}) => {
  const normalizedPayload = buildAdminUserPayload(payload, { includePassword: !isEditing });
  const normalizedCurrentUserId = String(currentUserId ?? '').trim();

  if (!normalizedPayload.firstName) {
    return { ok: false, error: 'El nombre es obligatorio.' };
  }

  if (!normalizedPayload.lastName) {
    return { ok: false, error: 'El apellido es obligatorio.' };
  }

  if (!normalizedPayload.email) {
    return { ok: false, error: 'El correo electrónico es obligatorio.' };
  }

  const existingUser = appConfig.useRemoteApi ? null : findUserByEmail(normalizedPayload.email);

  if (existingUser && String(existingUser.id) !== normalizedCurrentUserId) {
    return { ok: false, error: 'Ya existe un usuario con ese correo electrónico.' };
  }

  if (!isEditing) {
    if (!normalizedPayload.password) {
      return { ok: false, error: 'La contraseña es obligatoria para crear el usuario.' };
    }

    if (normalizedPayload.password.length < MIN_REGISTER_PASSWORD_LENGTH) {
      return {
        ok: false,
        error: `La contraseña debe tener al menos ${MIN_REGISTER_PASSWORD_LENGTH} caracteres.`,
      };
    }
  }

  return { ok: true, payload: normalizedPayload };
};

const normalizeAuthResponse = (payload) => {
  const sessionUser = toSessionUser(payload?.user ?? payload);

  if (!sessionUser) {
    return { ok: false, error: 'La respuesta de autenticación no contiene un usuario válido.' };
  }

  saveSessionUser(sessionUser);
  saveSessionToken(payload?.sessionToken ?? payload?.token);

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'cart') && payload.cart) {
    saveCart(payload.cart);
  }

  return {
    ok: true,
    user: sessionUser,
    token: String(payload?.sessionToken ?? payload?.token ?? ''),
    sessionId: String(payload?.sessionId ?? ''),
    expiresAt: String(payload?.expiresAt ?? ''),
    cart: payload?.cart ?? null,
  };
};

const buildRemoteAuthPayload = (payload) => {
  const guestCartId = String(payload?.guestCartId ?? '').trim();
  const phone = String(payload?.phone ?? '').trim();

  return {
    ...payload,
    ...(phone ? { phone } : {}),
    ...(guestCartId ? { guestCartId } : {}),
  };
};

const syncRemoteCartAfterAuth = async (result, payload = {}) => {
  if (!appConfig.useRemoteApi || !result?.ok) {
    return result;
  }

  if (result.cart) {
    return result;
  }

  const guestCartId = String(payload?.guestCartId ?? '').trim();

  try {
    const cart = guestCartId
      ? await cartService.mergeCartAsync(guestCartId)
      : await cartService.getCartAsync();

    return {
      ...result,
      cart,
    };
  } catch {
    return result;
  }
};

function registerLocal({ firstName, lastName, email, password, phone }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirstName = String(firstName ?? '').trim();
  const normalizedLastName = String(lastName ?? '').trim();

  if (!normalizedFirstName) {
    return { ok: false, error: 'Ingresa el nombre para crear la cuenta.' };
  }

  if (!normalizedLastName) {
    return { ok: false, error: 'Ingresa el apellido para crear la cuenta.' };
  }

  if (!normalizedEmail) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' };
  }

  if (!password || password.length < MIN_REGISTER_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `La contraseña debe tener al menos ${MIN_REGISTER_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (findUserByEmail(normalizedEmail)) {
    return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
  }

  const user = createUser({
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    password,
    phone,
  });
  saveSessionUser(user);

  return { ok: true, user };
}

function loginLocal({ email, password }) {
  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    return { ok: false, error: 'Credenciales inválidas. Verifica correo y contraseña.' };
  }

  const sessionUser = toSessionUser(user);
  saveSessionUser(sessionUser);

  return { ok: true, user: sessionUser };
}

async function register(payload) {
  if (!appConfig.useRemoteApi) {
    return registerLocal(payload);
  }

  try {
    const response = await requestJson('/auth/register', {
      method: 'POST',
      body: buildRemoteAuthPayload(payload),
    });

    return await syncRemoteCartAfterAuth(normalizeAuthResponse(response), payload);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, 'No fue posible registrar la cuenta en este momento.'),
    };
  }
}

async function login(payload) {
  if (!appConfig.useRemoteApi) {
    return loginLocal(payload);
  }

  try {
    const response = await requestJson('/auth/login', {
      method: 'POST',
      body: buildRemoteAuthPayload(payload),
    });

    return await syncRemoteCartAfterAuth(normalizeAuthResponse(response), payload);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, 'No fue posible iniciar sesión en este momento.'),
    };
  }
}

async function hydrateSession() {
  const sessionUser = loadSessionUser();

  if (!appConfig.useRemoteApi) {
    return { ok: true, user: sessionUser };
  }

  const token = loadSessionToken();

  // Only call /auth/me when there is both a token AND a persisted user.
  // A guest cart session saves a token without a user, so this prevents
  // the guest token from being sent to /auth/me and invalidated on 401.
  if (!token || !sessionUser) {
    return { ok: true, user: sessionUser ?? null };
  }

  try {
    const response = await requestJson('/auth/me', {
      method: 'GET',
      token,
    });

    return await syncRemoteCartAfterAuth(normalizeAuthResponse({ user: response, token }));
  } catch (error) {
    clearSessionUser();
    clearSessionToken();

    return {
      ok: false,
      user: null,
      error: getErrorMessage(error, 'No fue posible restaurar la sesión actual.'),
    };
  }
}

async function logout() {
  if (appConfig.useRemoteApi) {
    try {
      const token = loadSessionToken();

      if (token) {
        await requestJson('/auth/logout', {
          method: 'POST',
          token,
        });
      }
    } catch {
      // Clear local session even if remote logout fails.
    }
  }

  clearSessionUser();
  clearSessionToken();

  return { ok: true };
}

function getSessionUser() {
  return loadSessionUser();
}

function getAdminUsers() {
  return loadUsers()
    .map((user) => toSessionUser(user))
    .filter(Boolean);
}

function listUsers() {
  return loadUsers();
}

async function getAdminUsersAsync() {
  if (!appConfig.useRemoteApi) {
    return getAdminUsers();
  }

  const token = loadSessionToken();
  const response = await requestJson('/admin/users', {
    method: 'GET',
    token,
  });

  return (Array.isArray(response) ? response : [])
    .map((user) => toSessionUser(user))
    .filter(Boolean);
}

async function getAdminUserByIdAsync(userId) {
  const normalizedUserId = String(userId ?? '').trim();

  if (!normalizedUserId) {
    throw new Error('No fue posible identificar el usuario a consultar.');
  }

  if (!appConfig.useRemoteApi) {
    const user = loadUsers().find((savedUser) => String(savedUser.id) === normalizedUserId) ?? null;
    return toSessionUser(user);
  }

  const token = loadSessionToken();
  const response = await requestJson(`/admin/users/${normalizedUserId}`, {
    method: 'GET',
    token,
  });

  return toSessionUser(response);
}

async function createAdminUserAsync(payload) {
  const validation = validateAdminUserPayload(payload, { isEditing: false });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (!appConfig.useRemoteApi) {
    const createdUser = createUser(validation.payload);
    const nextUser = updateUser(createdUser.id, {
      email: validation.payload.email,
      firstName: validation.payload.firstName,
      lastName: validation.payload.lastName,
      phone: validation.payload.phone,
      role: validation.payload.role,
      status: validation.payload.status,
    });

    return nextUser;
  }

  const token = loadSessionToken();
  const response = await requestJson('/admin/users', {
    method: 'POST',
    body: validation.payload,
    token,
  });

  const normalizedResponse = toSessionUser(response);

  if (normalizedResponse) {
    return normalizedResponse;
  }

  const nextUsers = await getAdminUsersAsync();
  const createdUser = nextUsers.find((user) => user.email === validation.payload.email) ?? null;

  if (!createdUser) {
    throw new Error('El usuario fue creado pero no se pudo refrescar desde el backend.');
  }

  return createdUser;
}

async function updateAdminUserAsync(userId, payload) {
  const normalizedUserId = String(userId ?? '').trim();

  if (!normalizedUserId) {
    throw new Error('No fue posible identificar el usuario a actualizar.');
  }

  const validation = validateAdminUserPayload(payload, {
    isEditing: true,
    currentUserId: normalizedUserId,
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (!appConfig.useRemoteApi) {
    const updatedUser = updateUser(normalizedUserId, validation.payload);

    if (!updatedUser) {
      throw new Error('No fue posible actualizar el usuario seleccionado.');
    }

    return updatedUser;
  }

  const token = loadSessionToken();
  const response = await requestJson(`/admin/users/${normalizedUserId}`, {
    method: 'PUT',
    body: validation.payload,
    token,
  });

  const normalizedResponse = toSessionUser(response);

  if (normalizedResponse) {
    return normalizedResponse;
  }

  const refreshedUser = await getAdminUserByIdAsync(normalizedUserId);

  if (!refreshedUser) {
    throw new Error('El usuario fue actualizado pero no se pudo refrescar desde el backend.');
  }

  return refreshedUser;
}

async function deleteAdminUserAsync(userId) {
  const normalizedUserId = String(userId ?? '').trim();

  if (!normalizedUserId) {
    throw new Error('No fue posible identificar el usuario a desactivar.');
  }

  if (!appConfig.useRemoteApi) {
    updateUser(normalizedUserId, { status: 'INACTIVE' });

    return getAdminUsers();
  }

  const token = loadSessionToken();
  await requestJson(`/admin/users/${normalizedUserId}`, {
    method: 'DELETE',
    token,
  });

  return getAdminUsersAsync();
}

async function updateProfile(userId, updates) {
  const normalizedUserId = String(userId ?? '').trim();

  if (!normalizedUserId) {
    return { ok: false, error: 'No existe una sesión válida para actualizar el perfil.' };
  }

  const profileUpdates = {
    firstName: String(updates?.firstName ?? '').trim(),
    lastName: String(updates?.lastName ?? '').trim(),
    phone: String(updates?.phone ?? '').trim(),
  };

  if (!profileUpdates.firstName) {
    return { ok: false, error: 'El nombre es obligatorio para actualizar el perfil.' };
  }

  if (!profileUpdates.lastName) {
    return { ok: false, error: 'El apellido es obligatorio para actualizar el perfil.' };
  }

  if (!appConfig.useRemoteApi) {
    const updatedUser = updateUser(normalizedUserId, profileUpdates);

    if (!updatedUser) {
      return { ok: false, error: 'No fue posible actualizar el perfil actual.' };
    }

    return { ok: true, user: updatedUser };
  }

  try {
    const token = loadSessionToken();
    const response = await requestJson('/users/me', {
      method: 'PUT',
      body: profileUpdates,
      token,
    });

    const normalizedResponse = response?.user
      ? normalizeAuthResponse({ ...response, token: response.token ?? token })
      : normalizeAuthResponse({ user: response, token });

    if (!normalizedResponse.ok) {
      return normalizedResponse;
    }

    return { ok: true, user: normalizedResponse.user };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, 'No fue posible actualizar el perfil en este momento.'),
    };
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const normalizedUserId = String(userId ?? '').trim();

  if (!normalizedUserId) {
    return { ok: false, error: 'No existe una sesión válida para cambiar la contraseña.' };
  }

  if (!currentPassword) {
    return { ok: false, error: 'Debes ingresar la contraseña actual.' };
  }

  if (!newPassword || newPassword.length < MIN_CHANGE_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `La nueva contraseña debe tener al menos ${MIN_CHANGE_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: 'La nueva contraseña debe ser diferente a la actual.' };
  }

  if (!appConfig.useRemoteApi) {
    const user = loadUsers().find((savedUser) => savedUser.id === normalizedUserId) ?? null;

    if (!user || user.password !== currentPassword) {
      return { ok: false, error: 'La contraseña actual es incorrecta.' };
    }

    const updatedUser = updateUser(normalizedUserId, { password: newPassword });

    if (!updatedUser) {
      return { ok: false, error: 'No fue posible actualizar la contraseña.' };
    }

    return { ok: true, user: updatedUser };
  }

  try {
    const token = loadSessionToken();
    await requestJson('/users/me/password', {
      method: 'PUT',
      body: {
        currentPassword,
        newPassword,
      },
      token,
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, 'No fue posible cambiar la contraseña en este momento.'),
    };
  }
}

const authService = {
  changePassword,
  createAdminUserAsync,
  deleteAdminUserAsync,
  getAdminUserByIdAsync,
  getAdminUsers,
  getAdminUsersAsync,
  hydrateSession,
  getSessionUser,
  listUsers,
  login,
  logout,
  register,
  updateAdminUserAsync,
  updateProfile,
};

export { authService };
export default authService;
