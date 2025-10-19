/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface User {
  id?: string;
  name: string;
  email: string;
  /** @default false */
  emailVerified: boolean;
  image?: string;
  /** @default "Generated at runtime" */
  createdAt: string;
  /** @default "Generated at runtime" */
  updatedAt: string;
  role?: string;
  /** @default false */
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  age?: number;
  chessWins?: number;
  chessLosses?: number;
  draughtsWins?: number;
  draughtsLosses?: number;
}

export interface Session {
  id?: string;
  expiresAt: string;
  token: string;
  /** @default "Generated at runtime" */
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
  impersonatedBy?: string;
}

export interface Account {
  id?: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  scope?: string;
  password?: string;
  /** @default "Generated at runtime" */
  createdAt: string;
  updatedAt: string;
}

export interface Verification {
  id?: string;
  identifier: string;
  value: string;
  expiresAt: string;
  /** @default "Generated at runtime" */
  createdAt: string;
  /** @default "Generated at runtime" */
  updatedAt: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Elysia Documentation
 * @version 0.0.0
 *
 * Development documentation
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @name GetIndex
   * @request GET:/
   */
  getIndex = (params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/`,
      method: "GET",
      ...params,
    });

  avatar = {
    /**
     * No description
     *
     * @tags avatars
     * @name GetAvatar
     * @summary Generate avatar image from name initials
     * @request GET:/avatar/
     */
    getAvatar: (
      query: {
        /**
         * The full name to generate initials from (e.g., "John Smith")
         * @minLength 1
         */
        name: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, any>({
        path: `/avatar/`,
        method: "GET",
        query: query,
        ...params,
      }),
  };
  blog = {
    /**
     * No description
     *
     * @tags blogs
     * @name GetBlog
     * @summary Get all blog posts with comment counts
     * @request GET:/blog/
     */
    getBlog: (params: RequestParams = {}) =>
      this.request<
        {
          id: string;
          title: string;
          snippet: string;
          likes: number;
          dislikes: number;
          commentCount: number;
          createdAt: date | string | number;
          updatedAt: date | string | number;
        }[],
        any
      >({
        path: `/blog/`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags blogs
     * @name GetBlogById
     * @summary Get blog post by ID with its comments
     * @request GET:/blog/{id}
     */
    getBlogById: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          blog: {
            id: string;
            title: string;
            snippet: string;
            content: string;
            likes: number;
            dislikes: number;
            commentCount: number;
            createdAt: date | string | number;
            updatedAt: date | string | number;
          };
          comments: {
            _id?: string;
            blogId: string;
            authorId: string;
            content: string;
            accepted: boolean;
            createdAt: date | string | number;
          }[];
        },
        any
      >({
        path: `/blog/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags blogs, comments
     * @name PostBlogByIdComment
     * @summary Add a comment to a blog post (unpublished by default)
     * @request POST:/blog/{id}/comment
     * @secure
     */
    postBlogByIdComment: (
      id: string,
      data: {
        /** Comment content */
        content: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          commentId: string;
        },
        any
      >({
        path: `/blog/${id}/comment`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags blogs, reactions
     * @name GetBlogByIdReaction
     * @summary Get current user's reaction on a blog post
     * @request GET:/blog/{id}/reaction
     * @secure
     */
    getBlogByIdReaction: (id: string, params: RequestParams = {}) =>
      this.request<boolean[], any>({
        path: `/blog/${id}/reaction`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags blogs, reactions
     * @name PatchBlogByIdReaction
     * @summary Set or toggle user's reaction on a blog post
     * @request PATCH:/blog/{id}/reaction
     * @secure
     */
    patchBlogByIdReaction: (
      id: string,
      data: {
        type: "like" | "dislike";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
        },
        any
      >({
        path: `/blog/${id}/reaction`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin, comments
     * @name GetBlogAdminCommentsPending
     * @summary Get all pending (unaccepted) comments - Admin only
     * @request GET:/blog/admin/comments/pending
     * @secure
     */
    getBlogAdminCommentsPending: (params: RequestParams = {}) =>
      this.request<
        {
          _id?: string;
          blogId: string;
          authorId: string;
          content: string;
          accepted: boolean;
          createdAt: date | string | number;
        }[],
        any
      >({
        path: `/blog/admin/comments/pending`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Admin moderation actions for comments: - **accept**: Sets comment accepted=true, makes it visible to all users - **deny**: Sets comment accepted=false, hides it from public view - **delete**: Permanently removes the comment from database Requires admin authentication. Only comments that need moderation will be visible to admins.
     *
     * @tags admin, comments
     * @name PatchBlogAdminCommentsByCommentIdModerate
     * @summary Moderate a comment (accept, deny, or delete) - Admin only
     * @request PATCH:/blog/admin/comments/{commentId}/moderate
     * @secure
     */
    patchBlogAdminCommentsByCommentIdModerate: (
      commentId: string,
      data: {
        action: "accept" | "deny" | "delete";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
        },
        any
      >({
        path: `/blog/admin/comments/${commentId}/moderate`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  profile = {
    /**
     * @description Retrieves publicly available user information including name, age, and game statistics.
     *
     * @tags profile
     * @name GetProfileByUserId
     * @summary Get public user profile by user ID
     * @request GET:/profile/{userId}
     */
    getProfileByUserId: (userId: string, params: RequestParams = {}) =>
      this.request<
        {
          id: string;
          name: string;
          image: string | null;
          createdAt: date | string | number;
          updatedAt: date | string | number;
          age: number | null;
          chessWins: number | null;
          chessLosses: number | null;
          draughtsWins: number | null;
          draughtsLosses: number | null;
        },
        any
      >({
        path: `/profile/${userId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  leaderboards = {
    /**
     * @description Retrieves a list of public user profiles ranked by the specified attribute value in descending order. Allowed attributes: age, chessWins, chessLosses, draughtsWins, draughtsLosses, name.
     *
     * @tags leaderboards
     * @name GetLeaderboards
     * @summary Get leaderboard of users ranked by a specific attribute
     * @request GET:/leaderboards/
     */
    getLeaderboards: (
      query: {
        /** The attribute name to rank users by (e.g., chessWins). Allowed attributes: age, chessWins, chessLosses, draughtsWins, draughtsLosses, name. */
        attribute: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          id: string;
          name: string;
          image: string | null;
          createdAt: date | string | number;
          updatedAt: date | string | number;
          age: number | null;
          chessWins: number | null;
          chessLosses: number | null;
          draughtsWins: number | null;
          draughtsLosses: number | null;
        }[],
        any
      >({
        path: `/leaderboards/`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  me = {
    /**
     * No description
     *
     * @name GetMe
     * @request GET:/me
     */
    getMe: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/me`,
        method: "GET",
        ...params,
      }),
  };
  auth = {
    /**
     * @description Sign in with a social provider
     *
     * @tags Better Auth
     * @name SocialSignIn
     * @request POST:/auth/api/sign-in/social
     * @secure
     */
    socialSignIn: (
      data: {
        /** Callback URL to redirect to after the user has signed in */
        callbackURL?: string | null;
        newUserCallbackURL?: string | null;
        /** Callback URL to redirect to if an error happens */
        errorCallbackURL?: string | null;
        provider: string;
        /** Disable automatic redirection to the provider. Useful for handling the redirection yourself */
        disableRedirect?: boolean | null;
        idToken?: {
          /** ID token from the provider */
          token: string;
          /** Nonce used to generate the token */
          nonce?: string | null;
          /** Access token from the provider */
          accessToken?: string | null;
          /** Refresh token from the provider */
          refreshToken?: string | null;
          /** Expiry date of the token */
          expiresAt?: number | null;
        };
        /** Array of scopes to request from the provider. This will override the default scopes passed. */
        scopes?: any[] | null;
        /** Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider */
        requestSignUp?: boolean | null;
        /** The login hint to use for the authorization code request */
        loginHint?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          redirect: false;
          /** Session token */
          token: string;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/sign-in/social`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get the current session
     *
     * @tags Better Auth
     * @name ApiGetSessionList
     * @request GET:/auth/api/get-session
     * @secure
     */
    apiGetSessionList: (params: RequestParams = {}) =>
      this.request<
        {
          session: Session;
          user: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/get-session`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Sign out the current user
     *
     * @tags Better Auth
     * @name ApiSignOutCreate
     * @request POST:/auth/api/sign-out
     * @secure
     */
    apiSignOutCreate: (data: object, params: RequestParams = {}) =>
      this.request<
        {
          success?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/sign-out`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Sign up a user using email and password
     *
     * @tags Better Auth
     * @name ApiSignUpEmailCreate
     * @request POST:/auth/api/sign-up/email
     * @secure
     */
    apiSignUpEmailCreate: (
      data: {
        /** The name of the user */
        name: string;
        /** The email of the user */
        email: string;
        /** The password of the user */
        password: string;
        /** The profile image URL of the user */
        image?: string;
        /** The URL to use for email verification callback */
        callbackURL?: string;
        /** If this is false, the session will not be remembered. Default is `true`. */
        rememberMe?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Authentication token for the session */
          token?: string | null;
          user: {
            /** The unique identifier of the user */
            id: string;
            /**
             * The email address of the user
             * @format email
             */
            email: string;
            /** The name of the user */
            name: string;
            /**
             * The profile image URL of the user
             * @format uri
             */
            image?: string | null;
            /** Whether the email has been verified */
            emailVerified: boolean;
            /**
             * When the user was created
             * @format date-time
             */
            createdAt: string;
            /**
             * When the user was last updated
             * @format date-time
             */
            updatedAt: string;
          };
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/sign-up/email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Sign in with email and password
     *
     * @tags Better Auth
     * @name ApiSignInEmailCreate
     * @request POST:/auth/api/sign-in/email
     * @secure
     */
    apiSignInEmailCreate: (
      data: {
        /** Email of the user */
        email: string;
        /** Password of the user */
        password: string;
        /** Callback URL to use as a redirect for email verification */
        callbackURL?: string | null;
        rememberMe?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          redirect: false;
          /** Session token */
          token: string;
          url?: null;
          user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            emailVerified: boolean;
            /** @format date-time */
            createdAt: string;
            /** @format date-time */
            updatedAt: string;
          };
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/sign-in/email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Send a password reset email to the user
     *
     * @tags Better Auth
     * @name ApiForgetPasswordCreate
     * @request POST:/auth/api/forget-password
     * @secure
     */
    apiForgetPasswordCreate: (
      data: {
        /** The email address of the user to send a password reset email to */
        email: string;
        /** The URL to redirect the user to reset their password. If the token isn't valid or expired, it'll be redirected with a query parameter `?error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?token=VALID_TOKEN */
        redirectTo?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          status?: boolean;
          message?: string;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/forget-password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset the password for a user
     *
     * @tags Better Auth
     * @name ApiResetPasswordCreate
     * @request POST:/auth/api/reset-password
     * @secure
     */
    apiResetPasswordCreate: (
      data: {
        /** The new password to set */
        newPassword: string;
        /** The token to reset the password */
        token?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          status?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/reset-password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verify the email of the user
     *
     * @tags Better Auth
     * @name ApiVerifyEmailList
     * @request GET:/auth/api/verify-email
     * @secure
     */
    apiVerifyEmailList: (
      query: {
        /** The token to verify the email */
        token: string;
        /** The URL to redirect to after email verification */
        callbackURL?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user: {
            /** User ID */
            id: string;
            /** User email */
            email: string;
            /** User name */
            name: string;
            /** User image URL */
            image: string;
            /** Indicates if the user email is verified */
            emailVerified: boolean;
            /** User creation date */
            createdAt: string;
            /** User update date */
            updatedAt: string;
          };
          /** Indicates if the email was verified successfully */
          status: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/verify-email`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Send a verification email to the user
     *
     * @tags Better Auth
     * @name ApiSendVerificationEmailCreate
     * @request POST:/auth/api/send-verification-email
     * @secure
     */
    apiSendVerificationEmailCreate: (
      data: {
        /**
         * The email to send the verification email to
         * @example "user@example.com"
         */
        email: string;
        /**
         * The URL to use for email verification callback
         * @example "https://example.com/callback"
         */
        callbackURL?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * Indicates if the email was sent successfully
           * @example true
           */
          status?: boolean;
        },
        | {
            /**
             * Error message
             * @example "Verification email isn't enabled"
             */
            message?: string;
          }
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/send-verification-email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Better Auth
     * @name ApiChangeEmailCreate
     * @request POST:/auth/api/change-email
     * @secure
     */
    apiChangeEmailCreate: (
      data: {
        /** The new email address to set must be a valid email address */
        newEmail: string;
        /** The URL to redirect to after email verification */
        callbackURL?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Indicates if the request was successful */
          status: boolean;
          /** Status message of the email change process */
          message?: "Email updated" | "Verification email sent" | null;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/change-email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Change the password of the user
     *
     * @tags Better Auth
     * @name ApiChangePasswordCreate
     * @request POST:/auth/api/change-password
     * @secure
     */
    apiChangePasswordCreate: (
      data: {
        /** The new password to set */
        newPassword: string;
        /** The current password is required */
        currentPassword: string;
        /** Must be a boolean value */
        revokeOtherSessions?: boolean | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** New session token if other sessions were revoked */
          token?: string | null;
          user: {
            /** The unique identifier of the user */
            id: string;
            /**
             * The email address of the user
             * @format email
             */
            email: string;
            /** The name of the user */
            name: string;
            /**
             * The profile image URL of the user
             * @format uri
             */
            image?: string | null;
            /** Whether the email has been verified */
            emailVerified: boolean;
            /**
             * When the user was created
             * @format date-time
             */
            createdAt: string;
            /**
             * When the user was last updated
             * @format date-time
             */
            updatedAt: string;
          };
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/change-password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the current user
     *
     * @tags Better Auth
     * @name ApiUpdateUserCreate
     * @request POST:/auth/api/update-user
     * @secure
     */
    apiUpdateUserCreate: (
      data: {
        /** The name of the user */
        name?: string;
        /** The image of the user */
        image?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Indicates if the update was successful */
          status?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/update-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete the user
     *
     * @tags Better Auth
     * @name ApiDeleteUserCreate
     * @request POST:/auth/api/delete-user
     * @secure
     */
    apiDeleteUserCreate: (
      data: {
        /** The callback URL to redirect to after the user is deleted */
        callbackURL?: string | null;
        /** The password of the user is required to delete the user */
        password?: string | null;
        /** The token to delete the user is required */
        token?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Indicates if the operation was successful */
          success: boolean;
          /** Status message of the deletion process */
          message: "User deleted" | "Verification email sent";
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/delete-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Redirects the user to the callback URL with the token
     *
     * @tags Better Auth
     * @name ApiResetPasswordDetail
     * @request GET:/auth/api/reset-password/{token}
     * @secure
     */
    apiResetPasswordDetail: (
      token: string,
      query?: {
        /** The URL to redirect the user to reset their password */
        callbackURL?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          token?: string;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/reset-password/${token}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Send a password reset email to the user
     *
     * @tags Better Auth
     * @name ApiRequestPasswordResetCreate
     * @request POST:/auth/api/request-password-reset
     * @secure
     */
    apiRequestPasswordResetCreate: (
      data: {
        /** The email address of the user to send a password reset email to */
        email: string;
        /** The URL to redirect the user to reset their password. If the token isn't valid or expired, it'll be redirected with a query parameter `?error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?token=VALID_TOKEN */
        redirectTo?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          status?: boolean;
          message?: string;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/request-password-reset`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all active sessions for the user
     *
     * @tags Better Auth
     * @name ApiListSessionsList
     * @request GET:/auth/api/list-sessions
     * @secure
     */
    apiListSessionsList: (params: RequestParams = {}) =>
      this.request<
        Session[],
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/list-sessions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Revoke a single session
     *
     * @tags Better Auth
     * @name ApiRevokeSessionCreate
     * @request POST:/auth/api/revoke-session
     * @secure
     */
    apiRevokeSessionCreate: (
      data: {
        /** The token to revoke */
        token: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Indicates if the session was revoked successfully */
          status: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/revoke-session`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Revoke all sessions for the user
     *
     * @tags Better Auth
     * @name ApiRevokeSessionsCreate
     * @request POST:/auth/api/revoke-sessions
     * @secure
     */
    apiRevokeSessionsCreate: (data: object, params: RequestParams = {}) =>
      this.request<
        {
          /** Indicates if all sessions were revoked successfully */
          status: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/revoke-sessions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Revoke all other sessions for the user except the current one
     *
     * @tags Better Auth
     * @name ApiRevokeOtherSessionsCreate
     * @request POST:/auth/api/revoke-other-sessions
     * @secure
     */
    apiRevokeOtherSessionsCreate: (data: object, params: RequestParams = {}) =>
      this.request<
        {
          /** Indicates if all other sessions were revoked successfully */
          status: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/revoke-other-sessions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Link a social account to the user
     *
     * @tags Better Auth
     * @name ApiLinkSocialCreate
     * @request POST:/auth/api/link-social
     * @secure
     */
    apiLinkSocialCreate: (
      data: {
        /** The URL to redirect to after the user has signed in */
        callbackURL?: string | null;
        provider: string;
        idToken?: {
          token: string;
          nonce?: string | null;
          accessToken?: string | null;
          refreshToken?: string | null;
          scopes?: any[] | null;
        };
        requestSignUp?: boolean | null;
        /** Additional scopes to request from the provider */
        scopes?: any[] | null;
        /** The URL to redirect to if there is an error during the link process */
        errorCallbackURL?: string | null;
        /** Disable automatic redirection to the provider. Useful for handling the redirection yourself */
        disableRedirect?: boolean | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** The authorization URL to redirect the user to */
          url?: string;
          /** Indicates if the user should be redirected to the authorization URL */
          redirect: boolean;
          status?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/link-social`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List all accounts linked to the user
     *
     * @tags Better Auth
     * @name ApiListAccountsList
     * @request GET:/auth/api/list-accounts
     * @secure
     */
    apiListAccountsList: (params: RequestParams = {}) =>
      this.request<
        {
          id: string;
          providerId: string;
          /** @format date-time */
          createdAt: string;
          /** @format date-time */
          updatedAt: string;
          accountId: string;
          scopes: string[];
        }[],
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/list-accounts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Callback to complete user deletion with verification token
     *
     * @tags Better Auth
     * @name ApiDeleteUserCallbackList
     * @request GET:/auth/api/delete-user/callback
     * @secure
     */
    apiDeleteUserCallbackList: (
      query?: {
        /** The token to verify the deletion request */
        token?: string;
        /** The URL to redirect to after deletion */
        callbackURL?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** Indicates if the deletion was successful */
          success: boolean;
          /** Confirmation message */
          message: "User deleted";
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/delete-user/callback`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Unlink an account
     *
     * @tags Better Auth
     * @name ApiUnlinkAccountCreate
     * @request POST:/auth/api/unlink-account
     * @secure
     */
    apiUnlinkAccountCreate: (
      data: {
        providerId: string;
        accountId?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          status?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/unlink-account`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh the access token using a refresh token
     *
     * @tags Better Auth
     * @name ApiRefreshTokenCreate
     * @request POST:/auth/api/refresh-token
     * @secure
     */
    apiRefreshTokenCreate: (
      data: {
        /** The provider ID for the OAuth provider */
        providerId: string;
        /** The account ID associated with the refresh token */
        accountId?: string | null;
        /** The user ID associated with the account */
        userId?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          tokenType?: string;
          idToken?: string;
          accessToken?: string;
          refreshToken?: string;
          /** @format date-time */
          accessTokenExpiresAt?: string;
          /** @format date-time */
          refreshTokenExpiresAt?: string;
        },
        | void
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/refresh-token`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a valid access token, doing a refresh if needed
     *
     * @tags Better Auth
     * @name ApiGetAccessTokenCreate
     * @request POST:/auth/api/get-access-token
     * @secure
     */
    apiGetAccessTokenCreate: (
      data: {
        /** The provider ID for the OAuth provider */
        providerId: string;
        /** The account ID associated with the refresh token */
        accountId?: string | null;
        /** The user ID associated with the account */
        userId?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          tokenType?: string;
          idToken?: string;
          accessToken?: string;
          refreshToken?: string;
          /** @format date-time */
          accessTokenExpiresAt?: string;
          /** @format date-time */
          refreshTokenExpiresAt?: string;
        },
        | void
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/get-access-token`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get the account info provided by the provider
     *
     * @tags Better Auth
     * @name ApiAccountInfoCreate
     * @request POST:/auth/api/account-info
     * @secure
     */
    apiAccountInfoCreate: (
      data: {
        /** The provider given account id for which to get the account info */
        accountId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user: {
            id: string;
            name?: string;
            email?: string;
            image?: string;
            emailVerified: boolean;
          };
          data: Record<string, any>;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/account-info`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Check if the API is working
     *
     * @tags Better Auth
     * @name ApiOkList
     * @request GET:/auth/api/ok
     * @secure
     */
    apiOkList: (params: RequestParams = {}) =>
      this.request<
        {
          /** Indicates if the API is working */
          ok: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/ok`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Displays an error page
     *
     * @tags Better Auth
     * @name ApiErrorList
     * @request GET:/auth/api/error
     * @secure
     */
    apiErrorList: (params: RequestParams = {}) =>
      this.request<
        string,
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/error`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Set the role of a user
     *
     * @tags Better Auth
     * @name SetRole
     * @request POST:/auth/api/admin/set-role
     * @secure
     */
    setRole: (
      data: {
        /** The user id */
        userId: string;
        /** The role to set, this can be a string or an array of strings. Eg: `admin` or `[admin, user]` */
        role: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/set-role`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get an existing user
     *
     * @tags Better Auth
     * @name GetUser
     * @request GET:/auth/api/admin/get-user
     * @secure
     */
    getUser: (
      query?: {
        /** The id of the User */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/get-user`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new user
     *
     * @tags Better Auth
     * @name CreateUser
     * @request POST:/auth/api/admin/create-user
     * @secure
     */
    createUser: (
      data: {
        /** The email of the user */
        email: string;
        /** The password of the user */
        password: string;
        /** The name of the user */
        name: string;
        role?: string | null;
        data?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/create-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a user's details
     *
     * @tags Better Auth
     * @name UpdateUser
     * @request POST:/auth/api/admin/update-user
     * @secure
     */
    updateUser: (
      data: {
        /** The user id */
        userId: string;
        /** The user data to update */
        data: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/update-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description List users
     *
     * @tags Better Auth
     * @name ListUsers
     * @request GET:/auth/api/admin/list-users
     * @secure
     */
    listUsers: (
      query?: {
        searchValue?: string | null;
        /** The field to search in, defaults to email. Can be `email` or `name`. Eg: "name" */
        searchField?: string | null;
        /** The operator to use for the search. Can be `contains`, `starts_with` or `ends_with`. Eg: "contains" */
        searchOperator?: string | null;
        limit?: string | null;
        offset?: string | null;
        /** The field to sort by */
        sortBy?: string | null;
        /** The direction to sort by */
        sortDirection?: string | null;
        /** The field to filter by */
        filterField?: string | null;
        filterValue?: string | null;
        /** The operator to use for the filter */
        filterOperator?: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          users: User[];
          total: number;
          limit?: number;
          offset?: number;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/list-users`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description List user sessions
     *
     * @tags Better Auth
     * @name ListUserSessions
     * @request POST:/auth/api/admin/list-user-sessions
     * @secure
     */
    listUserSessions: (
      data: {
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          sessions?: Session[];
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/list-user-sessions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Unban a user
     *
     * @tags Better Auth
     * @name UnbanUser
     * @request POST:/auth/api/admin/unban-user
     * @secure
     */
    unbanUser: (
      data: {
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/unban-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Ban a user
     *
     * @tags Better Auth
     * @name BanUser
     * @request POST:/auth/api/admin/ban-user
     * @secure
     */
    banUser: (
      data: {
        /** The user id */
        userId: string;
        /** The reason for the ban */
        banReason?: string | null;
        /** The number of seconds until the ban expires */
        banExpiresIn?: number | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/ban-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Impersonate a user
     *
     * @tags Better Auth
     * @name ImpersonateUser
     * @request POST:/auth/api/admin/impersonate-user
     * @secure
     */
    impersonateUser: (
      data: {
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          session?: Session;
          user?: User;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/impersonate-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Better Auth
     * @name ApiAdminStopImpersonatingCreate
     * @request POST:/auth/api/admin/stop-impersonating
     * @secure
     */
    apiAdminStopImpersonatingCreate: (params: RequestParams = {}) =>
      this.request<
        any,
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/stop-impersonating`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Revoke a user session
     *
     * @tags Better Auth
     * @name RevokeUserSession
     * @request POST:/auth/api/admin/revoke-user-session
     * @secure
     */
    revokeUserSession: (
      data: {
        /** The session token */
        sessionToken: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/revoke-user-session`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Revoke all user sessions
     *
     * @tags Better Auth
     * @name RevokeUserSessions
     * @request POST:/auth/api/admin/revoke-user-sessions
     * @secure
     */
    revokeUserSessions: (
      data: {
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/revoke-user-sessions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a user and all their sessions and accounts. Cannot be undone.
     *
     * @tags Better Auth
     * @name RemoveUser
     * @request POST:/auth/api/admin/remove-user
     * @secure
     */
    removeUser: (
      data: {
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/remove-user`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Set a user's password
     *
     * @tags Better Auth
     * @name SetUserPassword
     * @request POST:/auth/api/admin/set-user-password
     * @secure
     */
    setUserPassword: (
      data: {
        /** The new password */
        newPassword: string;
        /** The user id */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          status?: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/set-user-password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Check if the user has permission
     *
     * @tags Better Auth
     * @name ApiAdminHasPermissionCreate
     * @request POST:/auth/api/admin/has-permission
     * @secure
     */
    apiAdminHasPermissionCreate: (
      data: {
        /**
         * The permission to check
         * @deprecated
         */
        permission?: object;
        /** The permission to check */
        permissions: object;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          error?: string;
          success: boolean;
        },
        | {
            message: string;
          }
        | {
            message?: string;
          }
      >({
        path: `/auth/api/admin/has-permission`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
