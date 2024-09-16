import React, { useState, useEffect, useContext, useRef } from 'react';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import Button from "components/CustomButtons/Button.js";
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import AlertDialog from '../components/AlertDialog';
import { FirebaseContext } from 'common';
import { useTranslation } from "react-i18next";
import moment from 'moment/min/moment-with-locales';
import CardContent from '@material-ui/core/CardContent';
import {
  Select,
  MenuItem
} from '@material-ui/core';

import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
    width: 192,
    height: 192
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  rootRtl: {
    "& label": {
      right: 10,
      left: "auto",
      paddingRight: 20
    },
    "& legend": {
      textAlign: "right",
      marginRight: 20
    }
  },
  rootRtl_1: {
    "& label": {
      right: 10,
      left: "auto",
      paddingRight: 33
    },
    "& legend": {
      textAlign: "right",
      marginRight: 25
    }
  },
  submit2: {
    marginLeft:75,
    top:-40,
    margin: theme.spacing(3, 0, 2),
    backgroundColor:'#019b9d'
  },
  icon: {
    backgroundColor: 'red',
    width: 30,
    height: 30
  }
}));

const MyProfile = () => {
  const { api } = useContext(FirebaseContext);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir();
  const {
    updateProfile,
    updateWebProfileImage,
    fetchUsersOnce
  } = api;
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const classes = useStyles();
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const languagedata = useSelector(state => state.languagedata);
  const [langSelection, setLangSelection] = useState(0);
  const [multiLanguage,setMultiLanguage] = useState();
  const fileInputRef=useRef();
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    regType: null,
    usertype: ''
  });

  useEffect(()=>{
    if(languagedata.langlist){
      let arr = Object.keys(languagedata.langlist);
      for (let i=0; i< arr.length; i++) {
        if(auth.info.profile && auth.info.profile.lang && auth.info.profile.lang.langLocale && auth.info.profile.lang.langLocale === languagedata.langlist[arr[i]].langLocale){
          setLangSelection(i);
        }
      }
      setMultiLanguage(languagedata.langlist);
    }
  },[languagedata.langlist,auth.info,setMultiLanguage,setLangSelection]);

  useEffect(() => {
    if (auth.info && auth.info.profile) {
      setData({
        firstName: !auth.info.profile.firstName || auth.info.profile.firstName === ' ' ? '' : auth.info.profile.firstName,
        lastName: !auth.info.profile.lastName || auth.info.profile.lastName === ' ' ? '' : auth.info.profile.lastName,
        email: !auth.info.profile.email || auth.info.profile.email === ' ' ? '' : auth.info.profile.email,
        mobile: !auth.info.profile.mobile || auth.info.profile.mobile === ' ' ? '' : auth.info.profile.mobile,
        regType:auth.info.profile.regType,
        usertype: auth.info.profile.usertype,
        uid: auth.info.uid,
        profile_image: auth.info.profile.profile_image ?  auth.info.profile.profile_image : ''
      });
    }
  }, [auth.info]);

  const updateData = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(data.email)) {
      let arr = Object.keys(languagedata.langlist);
      dispatch(updateProfile(auth.info, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        lang: {langLocale: multiLanguage[arr[langSelection]].langLocale, dateLocale:multiLanguage[arr[langSelection]].dateLocale }
      }));

      if(selectedImage){
        setLoading(true);
        dispatch(updateWebProfileImage(auth.info, selectedImage));
        dispatch(fetchUsersOnce());
      }

      const lang = multiLanguage[arr[langSelection]];
      i18n.addResourceBundle(multiLanguage[arr[langSelection]].langLocale, 'translations', multiLanguage[arr[langSelection]].keyValuePairs);
      i18n.changeLanguage(lang.langLocale);
      moment.locale(lang.dateLocale);
      setTimeout(()=>{     
        setCommonAlert({ open: true, msg: t('profile_updated') });
        setSelectedImage(null);
        setLoading(false);
      },10000)
      
    } else {
      setCommonAlert({ open: true, msg: t('proper_email') })
    }
  }

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  const handleLanguageSelect = (event) => {
    setLangSelection(event.target.value);
  };

  const profileImageChange = async (e)=>{
    setSelectedImage( e.target.files[0]);
  }
  return (
    auth.loading ? <CircularLoading /> :
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <form className={classes.form} onSubmit={handleSubmit} style={{ direction: isRTL === 'rtl' ? 'rtl' : 'ltr' }}>
            <Typography component="h1" variant="h5" style={{ marginTop: '8px', textAlign: 'center' }}>
              {t('profile')}
            </Typography>
            <CardContent className={classes.img}>
              {selectedImage ?
                   <div  onClick={()=>fileInputRef.current.click()} style={{display:'flex',justifyContent:'center'}}>
                <img src = {URL.createObjectURL(selectedImage)} alt='Profile'
                style={{width:130, height:130, borderRadius: 65}}/>
           </div>
                :
                data.profile_image ?
                <div  onClick={()=>fileInputRef.current.click()} style={{display:'flex',justifyContent:'center'}}>
                  <img src = {data.profile_image} alt='Profile'
                  style={{width:130, height:130, borderRadius: 65}}/>
                       </div>
                :
                <div  onClick={()=>fileInputRef.current.click()} style={{display:'flex',justifyContent:'center'}}>
                  <img src = {require("../assets/img/profilePic.png").default} alt='Profile'
                  style={{width:130, height:130, borderRadius: 65}}/>
                  </div>
              } 
              <input onChange={(event)=>profileImageChange(event)} multiple={false} ref={fileInputRef} type='file' hidden/>
            </CardContent> 

            <TextField
              className={isRTL === "rtl" ? classes.rootRtl : null}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="firstName"
              label={t('firstname')}
              name="firstName"
              autoComplete="firstName"
              onChange={updateData}
              value={data.firstName}
              autoFocus
            />
            <TextField
              className={isRTL === "rtl" ? classes.rootRtl_1 : null}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="lastName"
              label={t('lastname')}
              name="lastName"
              autoComplete="lastName"
              onChange={updateData}
              value={data.lastName}
            />
            <TextField
              className={isRTL === "rtl" ? classes.rootRtl : null}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email')}
              name="email"
              autoComplete="email"
              onChange={updateData}
              value={data.email}
              disabled={(data.regType==='email'  || data.regType==='admin' || data.regType==='registration') ? true : false}
            />
            <TextField
              className={isRTL === "rtl" ? classes.rootRtl : null}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="mobile"
              label={t('phone')}
              name="mobile"
              autoComplete="mobile"
              onChange={updateData}
              value={data.mobile}
              disabled={(data.regType==='mobile'  || data.regType==='admin' || data.regType==='registration') ?true:false}
            />
            <TextField
              className={isRTL === "rtl" ? classes.rootRtl : null}
              variant="outlined"
              margin="normal"
              fullWidth
              id="usertype"
              label={t('usertype')}
              name="usertype"
              value={data.usertype}
              disabled={true}
            />
            {multiLanguage ?
              <Select
                id="language-select"
                className={classes.input}
                value={langSelection}
                variant="outlined"
                onChange={handleLanguageSelect}
                style={{ backgroundColor: '#fff', width: '100%', marginTop: '16px', }}
              >
                {
                  Object.keys(multiLanguage).map((key,index) => <MenuItem key={key} value={index}>
                    {multiLanguage[key].langName}
                  </MenuItem>)
                }
              </Select>
              : null}
              {loading ?
                <Grid
                  container
                  spacing={0}
                  alignItems="center"
                  justify="center"
                  style={{ minHeight: '3vh', paddingTop: 20}} >
                  <CircularProgress/>
                </Grid>
              :
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="secondaryButton"
                  className={classes.submit}
                >
                  {t('submit')}
                </Button>
              }
          </form>
        </div>
        <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
      </Container>
  );
};

export default MyProfile;