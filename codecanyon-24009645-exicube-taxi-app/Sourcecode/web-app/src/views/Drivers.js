import React,{ useState, useEffect, useContext, useRef } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { FirebaseContext } from 'common';
import { useTranslation } from "react-i18next";
import moment from 'moment/min/moment-with-locales';
import { makeStyles } from '@material-ui/core/styles';
import {
  Modal,
  Grid,
  Typography
} from '@material-ui/core';
import {colors} from '../components/Theme/WebTheme';
import Button from "components/CustomButtons/Button.js";
import CancelIcon from '@material-ui/icons/Cancel';
import AlertDialog from '../components/AlertDialog';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles((theme) => ({
  heading:{
   marginBottom:20,
  height:'10%'
  },
  submit1: {
    marginLeft:30 
  },
  submit: {
    backgroundColor:'#de7d1e',
  },
  submit5: {
    backgroundColor:'#0c5c6b',
  },
  submit3:{
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
  },
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 500,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    borderRadius:15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit4:{
    backgroundColor:'red',
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
  }
}));

export default function Users() {
  const { api } = useContext(FirebaseContext);
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const {
    addUser,
    editUser, 
    deleteUser,
    checkUserExists,
    fetchUsersOnce,
    updateLicenseImage
  } = api;
  const [data, setData] = useState([]);
  const [cars, setCars] = useState({});
  const staticusers = useSelector(state => state.usersdata.staticusers);
  const cartypes = useSelector(state => state.cartypes);
  const auth = useSelector(state => state.auth);
  const settings = useSelector(state => state.settingsdata.settings);
  const dispatch = useDispatch();
  const loaded = useRef(false);
  const classes = useStyles();
  const rootRef = useRef(null);

  useEffect(()=>{
      dispatch(fetchUsersOnce());
  },[dispatch,fetchUsersOnce]);

  useEffect(()=>{
    if(staticusers){
        setData(staticusers.filter(user => user.usertype ==='driver' && ((user.fleetadmin === auth.info.uid && auth.info.profile.usertype === 'fleetadmin')|| auth.info.profile.usertype === 'admin')));
    }else{
      setData([]);
    }
    loaded.current = true;
  },[staticusers,auth.info.profile.usertype,auth.info.uid]);

  useEffect(()=>{
    if(cartypes.cars){
        let obj =  {};
        cartypes.cars.map((car)=> obj[car.name]=car.name)
        setCars(obj);
    }
  },[cartypes.cars]);

  const onClick = (rowData) => {
    setImageData(rowData.licenseImage);
    setProfileModal(true);
    setUserData(rowData);
  };

  const columns = [
      { title: t('createdAt'), field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt? moment(rowData.createdAt).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('first_name'), field: 'firstName', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('last_name'), field: 'lastName', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('mobile'), field: 'mobile', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.mobile : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('email'), field: 'email', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.email : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'},headerStyle:{textAlign:'center'}},
      { title: t('profile_image'),  field: 'profile_image', render: rowData => rowData.profile_image?<img alt='Profile' src={rowData.profile_image} style={{width: 50,borderRadius:'50%'}}/>:null, editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('vehicle_model_name'), field: 'vehicleMake', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('vehicle_model_no'), field: 'vehicleModel', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('vehicle_reg_no'), field: 'vehicleNumber', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('other_info'), field: 'other_info', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('car_type'), field: 'carType',lookup: cars,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('account_approve'),  field: 'approved', type:'boolean', initialEditValue: true,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('driver_active'),  field: 'driverActiveStatus', type:'boolean', initialEditValue: true,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('lisence_image'),  field: 'licenseImage',render: rowData => rowData.licenseImage? <button onClick={()=>{onClick(rowData)}}><img alt='License' src={rowData.licenseImage} style={{width: 100}}/></button>:null,},
      { title: t('wallet_balance'),  field: 'walletBalance', type:'numeric' , editable:'never', initialEditValue: 0,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('you_rated_text'), render: rowData => <span>{rowData.ratings?rowData.ratings.userrating: "0"}</span>,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('signup_via_referral'), field: 'signupViaReferral', editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('referralId'),  field: 'referralId', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankName'),  field: 'bankName',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankCode'),  field: 'bankCode', hidden: settings.bank_fields===false? true: false, initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankAccount'),  field: 'bankAccount',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('queue'),  field: 'queue', type:'boolean', initialEditValue: false,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
  ];

  const [profileModal, setProfileModal] =  useState(false);
  const [imageData, setImageData] =  useState(false);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null); 
  const handleProfileModal = (e) => {
    setProfileModal(false);
    setSelectedImage(null);
  }

  const [userData, setUserData] = useState();

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  const handleSetProfileModal = (e) =>{
        e.preventDefault();
          if(selectedImage){
            setLoading(true);
            dispatch(updateLicenseImage(userData, selectedImage));
            setProfileModal(false); 
            setSelectedImage(null);
            setTimeout(()=>{
              setLoading(false); 
              dispatch(fetchUsersOnce());
            },10000);
            
          }
          else{
            setCommonAlert({ open: true, msg: t('choose_image_first') })
          }
  }

  return (
    !loaded.current? <CircularLoading/>:
    <div style={{backgroundColor:colors.LandingPage_Background}}>
    <MaterialTable
      title={t('drivers')}
      columns={columns}
      style={{direction:isRTL ==='rtl'?'rtl':'ltr'}}
      data={data}
      options={{
        exportButton: settings.AllowCriticalEditsAdmin,
        sorting: true,
      }}
      localization={{body:{
        addTooltip: (t('add')),
        deleteTooltip: (t('delete')),
        editTooltip: (t('edit')),
        emptyDataSourceMessage: (
          (t('blank_message'))
      ),
      editRow: { 
        deleteText: (t('delete_message')),
        cancelTooltip: (t('cancel')),
        saveTooltip: (t('save')) 
          }, 
        },
        toolbar: {
          searchPlaceholder: (t('search')),
          exportTitle: (t('export')),
        },
        header: {
          actions: (t('actions')) 
      },
      pagination: {
        labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
        labelRowsSelect: (t('rows')),
        firstTooltip: (t('first_page_tooltip')),
        previousTooltip: (t('previous_page_tooltip')),
        nextTooltip: (t('next_page_tooltip')),
        lastTooltip: (t('last_page_tooltip'))
      },
      }}
      editable={{
        onRowAdd: newData =>
        new Promise((resolve,reject) => {
          setTimeout(() => {
            checkUserExists(newData).then((res) => {
              if (res.users && res.users.length > 0) {
                alert(t('user_exists'));
                reject();
              }
              else if(res.error){
                alert(t('email_or_mobile_issue'));
                reject();
              }
              else if(newData.licenseImage === '' || !newData.licenseImage){
                alert(t('proper_input_licenseimage'));
                reject();
              }
              else{
                newData['regType'] = 'admin';
                newData['usertype'] = 'driver';
                newData['createdAt'] = new Date().toISOString();
                const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
                newData['referralId'] = reference;
                let role = auth.info.profile.usertype;
                if(role === 'fleetadmin'){
                  newData['fleetadmin'] = auth.info.uid; 
                }
                dispatch(addUser(newData));
                dispatch(fetchUsersOnce());
                resolve();
              }
            });
          }, 600);
        }),
        onRowUpdate: (newData, oldData) =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(editUser(oldData.id,newData));
              dispatch(fetchUsersOnce());
            }, 600);
          }),
        onRowDelete: oldData =>
          settings.AllowCriticalEditsAdmin?
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(deleteUser(oldData.id));
              dispatch(fetchUsersOnce());
            }, 600);
          })
          :
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              alert(t('demo_mode'));
            }, 600);
          })
          , 
      }}
    />
     <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={profileModal}
        onClose={handleProfileModal}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <Grid container spacing={1} className={classes.paper} style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Typography component="h1" variant="h6">
                      {t('lisence_image')}
                      <input
                          type="file"
                          style={{marginLeft:10}}
                          name= {t('image')}
                          onChange={(event) => {
                              setSelectedImage(event.target.files[0]);
                          }}
                      />
                </Typography>
              </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  {selectedImage  && !loading ? 
                    <Tooltip title={t('cancel')}>
                      <CancelIcon onClick={()=>setSelectedImage(null)} style={{ fontSize: 30,backgroundColor:'red',borderRadius:50,color:"white" }}  />
                    </Tooltip>
                  : null }
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    {selectedImage ? 
                      <img alt="not fount" height={"200px"} src={URL.createObjectURL(selectedImage)} style={{marginTop:15,marginBottom:20}}/>
                    :
                      <img alt="licimage" height={"200px"} src={imageData} style={{marginTop:10}}/>
                    }
                    <br />
                  </Grid>
                
          <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
            {loading ? 
            <Grid
              container
              spacing={0}
              alignItems="center"
              justify="center"
              style={{ minHeight: '5vh' }} >
              <CircularProgress/>
            </Grid>
            :
            <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
            <Button onClick={handleProfileModal} variant="contained" color="dangerColor">
            {t('cancel')}
          </Button> 
            <Button onClick={handleSetProfileModal} variant="contained" color="secondaryButton" style={{marginLeft:10}}>
              {t('save')}
            </Button>
            </Grid>
            }
          </Grid>
        </Grid>
      </Modal>
      <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
      </div>
  );
}
