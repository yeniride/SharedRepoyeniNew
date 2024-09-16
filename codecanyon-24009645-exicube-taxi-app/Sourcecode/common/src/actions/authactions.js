import {
  FETCH_USER,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILED,
  USER_SIGN_IN,
  USER_SIGN_IN_FAILED,
  USER_SIGN_OUT,
  CLEAR_LOGIN_ERROR,
  UPDATE_USER_PROFILE,
  USER_DELETED,
  REQUEST_OTP,
  REQUEST_OTP_SUCCESS,
  REQUEST_OTP_FAILED
} from "../store/types";

import store from '../store/store';

export const readProfile = () => async (firebase) =>{
  const {
    auth,
    singleUserRef
  } = firebase;
  const uid = auth.currentUser.uid;
  const snapshot = await singleUserRef(uid).once('value');
  return snapshot.val();
}

export const fetchProfile = () => (dispatch) => (firebase) =>{
  const {
    auth,
    singleUserRef
  } = firebase;
  const uid = auth.currentUser.uid;
  singleUserRef(uid).once('value', snapshot => {
    dispatch({
      type: UPDATE_USER_PROFILE,
      payload: snapshot.val()
    });
  });
}

export const monitorProfileChanges = () => (dispatch) => (firebase) => {
  const {
    auth,
    singleUserRef,
  } = firebase;
  const uid = auth.currentUser.uid;
  singleUserRef(uid).child('queue').on('value', res => {
    const obj1 = store.getState().auth.info ? store.getState().auth.info.profile: {};
    singleUserRef(uid).once('value', snapshot => {
      const obj2  = snapshot.exists() ? snapshot.val():'';
      if(obj1 && obj1.queue != obj2.queue){
        dispatch({
          type: UPDATE_USER_PROFILE,
          payload: snapshot.val()
        });
      }
    });
  });
  singleUserRef(uid).child('walletBalance').on('value', res => {
    const obj1 = store.getState().auth.info ? store.getState().auth.info.profile: {};
    if(obj1.usertype == 'driver'){
      setTimeout(()=>{
        if(res.val()){
          singleUserRef(uid).once('value', snapshot => {
            const obj2  = snapshot.exists() ? snapshot.val():'';
            if(obj1.walletBalance != obj2.walletBalance){
              dispatch({
                type: UPDATE_USER_PROFILE,
                payload: snapshot.val()
              });
            }
          });
        }
      }, 1500);
    }
  });
  singleUserRef(uid).child('ratings').on('value', res => {
    const obj1 = store.getState().auth.info ? store.getState().auth.info.profile: {};
    singleUserRef(uid).once('value', snapshot => {
      const obj2  = snapshot.exists() ? snapshot.val():'';
      if(JSON.stringify(obj1.ratings) != JSON.stringify(obj2.ratings)){
        dispatch({
          type: UPDATE_USER_PROFILE,
          payload: snapshot.val()
        });
      }
    });
  });
  singleUserRef(uid).child('mobile').on('value', res => {
    const obj1 = store.getState().auth.info ? store.getState().auth.info.profile: {};
    singleUserRef(uid).once('value', snapshot => {
      const obj2  = snapshot.exists() ? snapshot.val():'';
      if(obj1.mobile != obj2.mobile){
        dispatch({
          type: UPDATE_USER_PROFILE,
          payload: snapshot.val()
        });
      }
    });
  });
}

export const fetchUser = () => (dispatch) => (firebase) => {
  const {
    auth,
    singleUserRef,
    driverDocsRef
  } = firebase;

  dispatch({
    type: FETCH_USER,
    payload: null
  });
  auth.onAuthStateChanged(user => {
    if (user) {
      singleUserRef(user.uid).once("value", async snapshot => {
        if (snapshot.val()) {
          user.profile = snapshot.val();
          if(user.profile.usertype == 'driver' && !user.profile.licenseImage ){
            let licenseImage = await driverDocsRef(user.uid).getDownloadURL();
            if(licenseImage){
              singleUserRef(user.uid).update({licenseImage: licenseImage});
            }
          }
          if (user.profile.approved) {
            dispatch({
              type: FETCH_USER_SUCCESS,
              payload: user
            });
          } else {
            auth.signOut();
            dispatch({
              type: USER_SIGN_IN_FAILED,
              payload: { code: store.getState().languagedata.defaultLanguage.auth_error, message: store.getState().languagedata.defaultLanguage.require_approval }
            });
          }
        }else{
          let noName  =  store.getState().languagedata.defaultLanguage.no_name;
          let regType;
          let mobile = ' ';
          let email =  ' ';
          let firstName = noName;
          let lastName = ' ';
          let profile_image = null;
          if(user.providerData.length == 0 && user.email){
            regType = 'email';
            email = user.email;
          }
          if(user.providerData.length > 0 && user.phoneNumber){
            mobile = user.phoneNumber;
            regType = 'mobile';
          }
          if (user.providerData.length > 0) {
            const provideData = user.providerData[0];
            if (provideData == 'phone') {
              mobile = provideData.phoneNumber;
              regType = 'mobile';
            }
            if (provideData.providerId == 'facebook.com' || provideData.providerId == 'apple.com') {
              regType = 'social';
              if (provideData.email) {
                email = provideData.email;
              }
              if (provideData.phoneNumber) {
                mobile = provideData.phoneNumber;
              }
              if (provideData.displayName) {
                if (provideData.displayName.split(" ").length > 0) {
                  firstName = provideData.displayName.split(" ")[0];
                  lastName = provideData.displayName.split(" ")[1];
                } else {
                  firstName = provideData.displayName;
                }
              }
              if (provideData.photoURL) {
                profile_image = provideData.photoURL;
              }
            }
          }
          const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
          let userData = {
            createdAt: new Date().toISOString(),
            firstName: firstName,
            lastName: lastName,
            mobile: mobile,
            email: email,
            usertype: 'rider',
            referralId: reference,
            approved: true,
            walletBalance: 0,
            regType: regType
          }
          if(profile_image){
            userData['profile_image'] = profile_image;
          }
          singleUserRef(user.uid).set(userData);
          user.profile = userData;
          dispatch({
            type: FETCH_USER_SUCCESS,
            payload: user
          });
        }
      });
    } else {
      dispatch({
        type: FETCH_USER_FAILED,
        payload: { code: store.getState().languagedata.defaultLanguage.auth_error, message: store.getState().languagedata.defaultLanguage.not_logged_in }
      });
    }
  });
};

export const validateReferer = (referralId) => async (firebase) => {
  const {
    config
  } = firebase;
  const response = await fetch(`https://${config.projectId}.web.app/validate_referrer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      referralId: referralId
    })
  })
  const json = await response.json();
  return json;
};

export const checkUserExists = (regData) => async (firebase) => {
  const {
    config
  } = firebase;
  const response = await fetch(`https://${config.projectId}.web.app/check_user_exists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: regData.email,
      mobile: regData.mobile
    })
  })
  const json = await response.json();
  return json;
};

export const mainSignUp = (regData) => async (firebase) => {
  const {
    config,
    driverDocsRef
  } = firebase;
  let url = `https://${config.projectId}.web.app/user_signup`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ regData: regData })
  })
  const res = await response.json();
  if(res.uid){
    await driverDocsRef(res.uid).put(regData.licenseImage);
  }
  return res;
};

export const requestEmailOtp = (email) => (dispatch) => async (firebase) => {
  const {
    config
  } = firebase;
  dispatch({
    type: REQUEST_OTP,
    payload: true
  });
  let url = `https://${config.projectId}.web.app/request_email_otp`;
  try{
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });
    const result = await response.json();
    if(result.success){
      dispatch({
        type: REQUEST_OTP_SUCCESS,
        payload: true
      });
    }else{
      dispatch({
        type: REQUEST_OTP_FAILED,
        payload: result.error
      });
    }
  }catch(error){
    console.log(error);
    dispatch({
      type: REQUEST_OTP_FAILED,
      payload: error
    });
  }
}

export const verifyEmailOtp = (email, otp) => (dispatch) => async (firebase) => {
  const {
    auth,
    config
  } = firebase;
  const body = {
    email: email,
    otp: otp
  };
  try{
    let url = `https://${config.projectId}.web.app/verify_email_otp`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    const result = await response.json();
    if(result.token){
      auth.signInWithCustomToken(result.token)
        .then((user) => {
          //OnAuthStateChange takes care of Navigation
        })
        .catch((error) => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        });
    }else{
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: result.error
      });
    }
  }catch(error){
    console.log(error);
    dispatch({
      type: USER_SIGN_IN_FAILED,
      payload: error
    });
  }
}


export const requestPhoneOtpDevice = (phoneNumber, appVerifier) => (dispatch) => async (firebase) => {
  const {
    phoneProvider
  } = firebase;
  dispatch({
    type: REQUEST_OTP,
    payload: null
  });
  try {
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      appVerifier
    );
    dispatch({
      type: REQUEST_OTP_SUCCESS,
      payload: verificationId
    });
  }
  catch (error) {
    dispatch({
      type: REQUEST_OTP_FAILED,
      payload: error
    });
  };
}

export const mobileSignIn = (verficationId, code) => (dispatch) => (firebase) => {
  const {
    auth,
    mobileAuthCredential,
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  auth.signInWithCredential(mobileAuthCredential(verficationId, code))
    .then((user) => {
      //OnAuthStateChange takes care of Navigation
    }).catch(error => {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
};

export const facebookSignIn = (token) => (dispatch) => (firebase) => {

  const {
    auth,
    facebookProvider,
    facebookCredential
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  if (token) {
    const credential = facebookCredential(token);
    auth.signInWithCredential(credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      })
      .catch(error => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      }
      );
  } else {
    auth.signInWithPopup(facebookProvider).then(function (result) {
      var token = result.credential.accessToken;
      const credential = facebookCredential(token);
      auth.signInWithCredential(credential)
        .then((user) => {
          //OnAuthStateChange takes care of Navigation
        })
        .catch(error => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        }
        );
    }).catch(function (error) {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
  }
};

export const appleSignIn = (credentialData) => (dispatch) => (firebase) => {

  const {
    auth,
    appleProvider
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  if (credentialData) {
    const credential = appleProvider.credential(credentialData);
    auth.signInWithCredential(credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      })
      .catch((error) => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      });
  } else {
    auth.signInWithPopup(appleProvider).then(function (result) {
      auth.signInWithCredential(result.credential)
        .then((user) => {
        //OnAuthStateChange takes care of Navigation
        })
        .catch(error => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        }
        );
    }).catch(function (error) {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
  }
};

export const signOut = () => (dispatch) => (firebase) => {

  const {
    auth,
    singleUserRef
  } = firebase;

  const uid = auth.currentUser.uid;

  singleUserRef(uid).child('queue').off();
  singleUserRef(uid).child('mobile').off();
  singleUserRef(uid).child('walletBalance').off();
  singleUserRef(uid).child('ratings').off();  

  singleUserRef(uid).once('value', snapshot => {
      if(snapshot.val()){
        const profile = snapshot.val();
        if (profile && profile.usertype === 'driver') {
          singleUserRef(uid).update({driverActiveStatus:false});
        }
        setTimeout(()=>{
          auth
          .signOut()
          .then(() => {
            dispatch({
              type: USER_SIGN_OUT,
              payload: null
            });
          })
          .catch(error => {
      
          });
        },2000)
      }
  });
};

export const deleteUser = (uid) => (dispatch) => (firebase) => {
  const {
    singleUserRef,
    auth
  } = firebase;

  singleUserRef(uid).child('queue').off();
  singleUserRef(uid).child('mobile').off();
  singleUserRef(uid).child('walletBalance').off();
  singleUserRef(uid).child('ratings').off();  

  singleUserRef(uid).remove().then(() => {
    if (auth.currentUser.uid == uid) {
      auth.signOut();
      dispatch({
        type: USER_DELETED,
        payload: null
      });
    }
  });
};

export const updateProfile = (userAuthData, updateData) => (dispatch) => async (firebase) => {

  const {
    singleUserRef,
    driverDocsRef
  } = firebase;

  let profile = userAuthData.profile;

  if (updateData.licenseImage) {
    await driverDocsRef(userAuthData.uid).put(updateData.licenseImage);
    updateData.licenseImage = await driverDocsRef(userAuthData.uid).getDownloadURL();
  }

  profile = { ...profile, ...updateData }
  dispatch({
    type: UPDATE_USER_PROFILE,
    payload: profile
  });
  singleUserRef(userAuthData.uid).update(updateData);
};


export const updateProfileImage = (userAuthData, imageBlob) => (dispatch) => (firebase) => {

  const {
    singleUserRef,
    profileImageRef,
  } = firebase;

  profileImageRef(userAuthData.uid).put(imageBlob).then(() => {
    imageBlob.close()
    return profileImageRef(userAuthData.uid).getDownloadURL()
  }).then((url) => {
    let profile = userAuthData.profile;
    profile.profile_image = url;
    singleUserRef(userAuthData.uid).update({
      profile_image: url
    });
    dispatch({
      type: UPDATE_USER_PROFILE,
      payload: profile
    });
  })
};

export const updateWebProfileImage = (userAuthData, imageBlob) => (dispatch) => async (firebase) => {

  const {
    singleUserRef,
    profileImageRef
  } = firebase;

    await profileImageRef(userAuthData.uid).put(imageBlob);
    let image = await profileImageRef(userAuthData.uid).getDownloadURL();
      let profile = userAuthData.profile;
      profile.profile_image = image;
      singleUserRef(userAuthData.uid).update(profile);
      dispatch({
        type: UPDATE_USER_PROFILE,
        payload: profile
      });
};

export const updatePushToken = (userAuthData, token, platform) => (dispatch) => (firebase) => {

  const {
    singleUserRef,
  } = firebase;

  let profile = userAuthData.profile;
  profile.pushToken = token;
  profile.userPlatform = platform;
  dispatch({
    type: UPDATE_USER_PROFILE,
    payload: profile
  });
  singleUserRef(userAuthData.uid).update({
    pushToken: token,
    userPlatform: platform
  });
};

export const clearLoginError = () => (dispatch) => (firebase) => {
  dispatch({
    type: CLEAR_LOGIN_ERROR,
    payload: null
  });
};

