import React, { useState, useEffect, useContext,useRef } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { FirebaseContext } from 'common';
import PhotoSizeSelectSmallIcon from '@material-ui/icons/PhotoSizeSelectSmall';
import { makeStyles } from '@material-ui/core/styles';
import FitnessCenterIcon from '@material-ui/icons/FitnessCenter';
import CancelScheduleSendIcon from '@material-ui/icons/CancelScheduleSend';
import { useTranslation } from "react-i18next";
import {
  Modal,
  Grid,
  Typography
} from '@material-ui/core';
import Button from "components/CustomButtons/Button.js";
import CancelIcon from '@material-ui/icons/Cancel';
import AlertDialog from '../components/AlertDialog';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit3:{
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
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
}));

export default function CarTypes() {
  const { api, appcat } = useContext(FirebaseContext);
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const settings = useSelector(state => state.settingsdata.settings);
  const {
    editCarType
  } = api;
  const columns = [
    { title: t('name'), field: 'name', cellStyle:isRTL ==='rtl'? {paddingRight:appcat === 'taxi'? 100: 180 , textAlign: 'right' }:{ paddingLeft: appcat === 'taxi'? 100: 180}, headerStyle:isRTL==='rtl'?{paddingRight: appcat === 'taxi'? 100: 180}:{ paddingLeft: appcat === 'taxi'? 100: 180}},
    { title: t('image'),  field: 'image',cellStyle:{ textAlign: 'center'},render: rowData => rowData.image? <button onClick={()=>{onClick(rowData)}}><img alt='CarImage' src={rowData.image} style={{width: 50}}/></button>:null,},
    { title: t('base_fare'), field: 'base_fare',  hidden:  appcat === 'rentals'? true: false, type: 'numeric', cellStyle:{ textAlign: 'center'}},
    { title: t('rate_per_unit_distance'), field: 'rate_per_unit_distance',  hidden:  appcat === 'rentals'? true: false, type: 'numeric', cellStyle:{ textAlign: 'center'}},
    { title: t('rate_per_hour'), field: 'rate_per_hour', type: 'numeric',  hidden:  appcat === 'rentals'? true: false, cellStyle:{ textAlign: 'center'}},
    { title: t('min_fare'), field: 'min_fare', type: 'numeric',  hidden:  appcat === 'rentals'? true: false, cellStyle:{ textAlign: 'center'}},
    { title: t('convenience_fee'), field: 'convenience_fees', type: 'numeric', cellStyle:{ textAlign: 'center'}},
    {
      title: t('convenience_fee_type'),
      field: 'convenience_fee_type',
      lookup: { flat: t('flat'), percentage: t('percentage')},
      cellStyle:{ textAlign: 'center'}
    },
    { title: t('extra_info'), field: 'extra_info' , cellStyle:{ textAlign:isRTL ==='rtl'? 'right' : 'left'}}
  ];

  const subcolumns = [
    { title: t('description'), field: 'description', render: rowData => <span>{rowData.description}</span> },
    { title: t('amount'), field: 'amount', type: 'numeric' }
  ];

  const subcolumns2 = [
    { title: t('minsDelayed'), field: 'minsDelayed', render: rowData => <span>{rowData.minsDelayed}</span> },
    { title: t('amount'), field: 'amount', type: 'numeric' }
  ];

  const [data, setData] = useState([]);
  const cartypes = useSelector(state => state.cartypes);
  const dispatch = useDispatch();
  const rootRef = useRef(null);
  const classes = useStyles();
  const [open,setOpen] = useState(false);
  const [rowIndex,setRowIndex] = useState();
  const [modalType,setModalType] = useState();

  const handleClose = () => {
    setOpen(false);
  }

  useEffect(() => {
    if (cartypes.cars) {
      setData(cartypes.cars);
    } else {
      setData([]);
    }
  }, [cartypes.cars]);

  const [selectedImage, setSelectedImage] = useState(null); 
  const handleProfileModal = (e) => {
    setProfileModal(false);
    setSelectedImage(null);
  }

  const [userData, setUserData] = useState();
  const [profileModal, setProfileModal] =  useState(false);
  const [imageData, setImageData] =  useState(false);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [loading, setLoading] = useState(false);

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  const handleSetProfileModal = (e) =>{
    e.preventDefault();
    if(selectedImage){
      setLoading(true);
      let finalData = userData;
      finalData.image = selectedImage;
      dispatch(editCarType(finalData, "UpdateImage"));
      setProfileModal(false); 
      setTimeout(()=>{
        setSelectedImage(null);
        setLoading(false); 
      },10000);
    }
    else{
      setCommonAlert({ open: true, msg: t('choose_image_first') })
    }
  }

  const onClick = (rowData) => {
    setImageData(rowData.image);
    setProfileModal(true);
    setUserData(rowData);
  };

  return (
    cartypes.loading ? <CircularLoading /> :
    <div ref={rootRef}>
      <MaterialTable
        title={t('car_type')}
        columns={columns}
        data={data}
        style={{direction:isRTL ==='rtl'?'rtl':'ltr'}}
        options={{
          exportButton: true,
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
          settings.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                  newData['createdAt'] = new Date().toISOString();
                  dispatch(editCarType(newData,"Add"));
                  resolve();
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            }),
          onRowUpdate: (newData, oldData) =>
            settings.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                dispatch(editCarType(newData,"Update"));
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            }),
          onRowDelete: oldData =>
            settings.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                dispatch(editCarType(oldData,"Delete"));
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(t('demo_mode'));
              }, 600);
            })
        }}
        actions={[
          rowData => (appcat === 'delivery'?{
            icon: () => <div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
                <PhotoSizeSelectSmallIcon />
                <Typography variant="subtitle2" style={{padding: 5}}>{t('parcel_types')}</Typography>
            </div>,
            onClick: (event, rowData) => {
              setModalType('parcelTypes')
              setRowIndex(rowData.tableData.id);
              setOpen(true);
            }
          }:null),
          rowData => (appcat === 'delivery'?{
            icon: () => <div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
                <FitnessCenterIcon />
                <Typography variant="subtitle2" style={{padding: 5}}>{t('options')}</Typography>
            </div>,
            onClick: (event, rowData) => {
              setModalType('options')
              setRowIndex(rowData.tableData.id);
              setOpen(true);
            }
          }:null),
          rowData => ({
            icon: () => <div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
                <CancelScheduleSendIcon />
                <Typography variant="subtitle2" style={{padding: 5}}>{t('cancelSlab')}</Typography>
            </div>,
            onClick: (event, rowData) => {
              setModalType('cancelSlab')
              setRowIndex(rowData.tableData.id);
              setOpen(true);
            }
          })
        ]}
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
                {t('car_image')}

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
                   <img alt="not fount" width={"200px"} height={"200px"}  src={URL.createObjectURL(selectedImage)} style={{marginTop:15,marginBottom:20}}/>
                   :
                    <img alt="not fount" width={"200px"} height={"200px"}  src={imageData} style={{marginTop:10}}/>
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
      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        onClose={handleClose}
        open={open}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <div className={classes.paper}>
          <MaterialTable
            title={modalType === 'options'?t('options') :( modalType === 'cancelSlab' ? t('cancelSlab'): t('parcel_types'))}
            columns={modalType === 'cancelSlab'? subcolumns2 :subcolumns }
            data={(data[rowIndex] && data[rowIndex][modalType])?data[rowIndex][modalType]:[]}
            options={{
              exportButton: true,
            }}
            editable={{
              onRowAdd: newData =>
                settings.AllowCriticalEditsAdmin?
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    if(!tblData[rowIndex][modalType]){
                      tblData[rowIndex][modalType] = [];
                    }
                    tblData[rowIndex][modalType].push(newData);
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                })
                :
                new Promise(resolve => {
                  setTimeout(() => {
                    resolve();
                    alert(t('demo_mode'));
                  }, 600);
                }),
              onRowUpdate: (newData, oldData) =>
                settings.AllowCriticalEditsAdmin?
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    tblData[rowIndex][modalType][tblData[rowIndex][modalType].indexOf(oldData)] = newData;
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                })
                :
                new Promise(resolve => {
                  setTimeout(() => {
                    resolve();
                    alert(t('demo_mode'));
                  }, 600);
                }),
              onRowDelete: oldData =>
                settings.AllowCriticalEditsAdmin?
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    tblData[rowIndex][modalType].splice(tblData[rowIndex][modalType].indexOf(oldData), 1);
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                })
                :
                new Promise(resolve => {
                  setTimeout(() => {
                    resolve();
                    alert(t('demo_mode'));
                  }, 600);
                }),
            }}  
          />
        </div>
      </Modal>
    </div>
  );
}
