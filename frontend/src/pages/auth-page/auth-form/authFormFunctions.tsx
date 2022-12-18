import React, {MouseEventHandler} from 'react';
import axios, {AxiosError, AxiosResponse} from 'axios';
import validator from 'email-validator';
import {UserInfoEditor} from '../../../globals/global-types';
const apiAddress = process.env.REACT_APP_APIBASEADDRESS;
console.log(apiAddress);

// ---------------- definitions (type, class, object) -------------------------//

export const authFaillures = {
  // form
  204: 'missing content',
  422: 'email not valid',
  // signin
  401: 'auth failed',
  404: 'user not found',
  // signup
  409: 'user already exists',
  // server
  500: 'request not supported',
} as const;

export type authFaillureCodes = keyof typeof authFaillures;

export type authFaillureType = typeof authFaillures[authFaillureCodes] | null;

export class AuthFormState {
  hasEverLoggedIn: boolean;
  authType: 'login' | 'signup';
  email?: string;
  password?: string;
  authFaillure: authFaillureType;
  authenticated: boolean;
  userId?: string;
  userRole?: string;
  accessToken?: string;
  refreshToken?: string;

  constructor() {
    this.hasEverLoggedIn =
      localStorage.getItem('hasEverLoggedIn') === 'true' ? true : false;
    this.authType = this.hasEverLoggedIn ? 'login' : 'signup';
    this.authFaillure = null;
    this.authenticated = false;
  }
}

export type apiAuthResponse = {
  userId: string;
  userEmail: string;
  userRole: string;
  accessToken: string;
  refreshToken: string;
};

// ---------------------------- JSX Elements -------------------------------//

export function newAuthType(formState: AuthFormState) {
  const loginType = formState.authType;

  if (loginType === 'login') {
    return 'signup';
  } else {
    return 'login';
  }
}

export function authGreeting(formState: AuthFormState) {
  if (formState.authType === 'login') {
    return <h1>Welcome Back!</h1>;
  } else {
    return <h1>Welcome!</h1>;
  }
}

export function authInstructions(formState: AuthFormState) {
  if (formState.authType === 'login') {
    return (
      <p className="authFormSubtitle" id="authInstructions">
        Please sign in below to continue!
      </p>
    );
  } else {
    return (
      <p className="authFormSubtitle" id="authInstructions">
        Please sign up below to get started!
      </p>
    );
  }
}

export function authToggleText(
  formState: AuthFormState,
  actionToPerform: MouseEventHandler
) {
  if (formState.authType === 'login') {
    return (
      <p className="authFormSubtitle" id="formToggleText">
        Don't have an account yet? {''}
        <span onClick={actionToPerform}>Sign Up</span>
      </p>
    );
  } else {
    return (
      <p className="authFormSubtitle" id="formToggleText">
        Already have an account? <span onClick={actionToPerform}>Sign In</span>
      </p>
    );
  }
}

export function authFormSubmitText(formState: AuthFormState) {
  if (formState.authType === 'login') {
    return 'Log in';
  } else {
    return 'Sign up';
  }
}

export function authFormFailText(formState: AuthFormState) {
  const failType = formState.authFaillure;
  if (!failType) {
    return '';
  } else if (failType === 'missing content') {
    return 'Please enter both an email and a password';
  } else if (failType === 'email not valid') {
    return 'Please enter a valid email';
  } else if (failType === 'user not found') {
    return 'No user exists with that email';
  } else if (failType === 'user already exists') {
    return 'An account already exists with that email';
  } else if (failType === 'auth failed') {
    return 'The password you have entered is invalid';
  } else if (failType === 'request not supported') {
    return "Sorry we're experiencing issues";
  }
}

// ---------------------- util function -------------------------///

/**
 * It checks if the form state is valid, and if it is, it returns
 * a string saying so, otherwise it returns a string saying
 * why it's not valid
 * @param {AuthFormState} formState - AuthFormState
 * @returns A string or an object
 */
export function checkSubmission(
  formState: AuthFormState
): 'valid submission' | authFaillureType {
  const {email, password} = formState;
  const validate = validator.validate;
  console.log(email + ' ' + password);
  if (email && password) {
    if (validate(email)) {
      return 'valid submission';
    } else {
      return 'email not valid';
    }
  } else {
    return 'missing content';
  }
}

export function generateUserObject(formState: AuthFormState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {authFaillure, authType, hasEverLoggedIn, password, ...authObject} =
    formState;
  return authObject;
}

// ----------------- API/Server access functions ---------------///

/**
 * It takes a form state object, and returns a user object
 * or an error code
 * @param {AuthFormState} formState - AuthFormState - This is the
 * state of the form that the user is submitting.
 * @returns a promise that resolves to either a user object or an error code.
 */
export async function apiAuthRequest(formState: AuthFormState) {
  const requestType = formState.authType;
  const apiAddressToAccess = apiAddress + '/api/auth/' + requestType;
  const formInputs = {
    email: formState.email,
    password: formState.password,
  };

  const responseObject = await axios
    .post(apiAddressToAccess, formInputs)
    .catch(error => {
      return error.toJSON() as AxiosError;
    });

  console.log(responseObject);
  const status = responseObject.status;

  if (status === 200) {
    return (responseObject as AxiosResponse).data as apiAuthResponse;
  } else if (typeof status === 'number') {
    return status;
  } else {
    return 500;
  }
}

/**
 * It takes a response status code and returns the corresponding authFaillure type
 * @param {number | string} responseStatus - The response status code from the server.
 * @returns The value of the key in the object that matches the responseStatus.
 */
export function getFaillureType(
  responseStatus: number | string
): authFaillureType {
  if (typeof responseStatus === 'number') {
    responseStatus = String(responseStatus);
  }
  const failCodes = Object.keys(authFaillures);
  const index = failCodes.indexOf(responseStatus);
  return Object.values(authFaillures)[index] as authFaillureType;
}

// function authenticatedAxiosInstance(accessToken: string) {
//   return axios.create({
//     headers: {
//       'Content-Type': 'application/json',
//       authorization: 'Bearer ' + accessToken,
//     },
//   });
// }

export async function logoutUser(refreshToken: string | null) {
  await axios.post(apiAddress + '/auth/logout', refreshToken);
}

export function updateUserInfo(
  userInfoEditor: UserInfoEditor,
  response: apiAuthResponse
) {
  if (userInfoEditor) {
    userInfoEditor('authenticated', true);
    userInfoEditor('userId', response.userId);
    userInfoEditor('userEmail', response.userEmail);
    userInfoEditor('userRole', response.userRole);
    userInfoEditor('accessToken', response.accessToken);
    userInfoEditor('refreshToken', response.refreshToken);
  }
}
