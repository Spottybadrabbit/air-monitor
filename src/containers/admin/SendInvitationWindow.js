import React, {useContext, useEffect, useState} from 'react';
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import {DialogTitle} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import withStyles from "@material-ui/core/es/styles/withStyles";
import FormGroup from "@material-ui/core/FormGroup";
import {Form, withFormik} from "formik";
import * as Yup from "yup";

import {AdminService} from "../../services/admin/AdminService";
import TinySpinner from "../../components/TinySpinner";
import InputFieldFormik from "../../components/InputFieldFormik";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import FormLabel from "@material-ui/core/FormLabel";
import LookupSelector from "../../components/lookup/LookupSelector";
import CollectionSelector from "../../components/lookup/CompanySelector";
import {uniq, compact, cloneDeep} from "lodash";


export const fieldNames = [{
    name: 'email',
    label: 'Email',
}, {
    name: 'groupName',
    label: 'Group',
    type: 'radio_option',
    options: [{name: 'ADMIN', label: 'Admin'}, {name: 'EDITOR', label: 'Editor'}, {name: 'VIEWER', label: "Viewer"}],
},{
    name:  'companyId',
    type: 'lookup',
    domainName: 'COMPANY',
    reference_type: 1
}];

const style = theme => ({
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        marginTop: theme.spacing(3),
    },
    groupNameLabel: {
        fontSize: '.8em'
    },
    groupNameOptions: {
        flexDirection: 'row'
    }
});


function SendInvitationWindow(props) {

    const {
        open,
        setOpen,
        values,
        classes,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
    } = props;


    const handleClose = React.useCallback(function handleClose() {
        setOpen(false);
    });

    return (
        <div>
            <Dialog maxWidth={'sm'} fullWidth={true} open={Boolean(open)} onClose={handleClose}
                    aria-labelledby="form-dialog-title">
                <Form className={classes.form} onSubmit={handleSubmit}>
                    <DialogTitle>
                        <Typography>
                            Send Invitation
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        {fieldNames && fieldNames.map((field, fieldIndex) => (
                            <React.Fragment key={'frag-group-1-' + fieldIndex}>
                                {field && field.isEditable !== false && (
                                    <React.Fragment key={'frag-group-2-' + fieldIndex}>
                                        {field.type === 'radio_option' ? (
                                            <RadioGroup className={classes.groupNameOptions}
                                                        key={'form-group-' + fieldIndex}>
                                                <FormLabel className={classes.groupNameLabel}
                                                           component="legend">{field.label}</FormLabel>
                                                {field.options.map((fieldItem, index) => (
                                                    <FormControlLabel key={'radio-box-' + index}
                                                                      value={fieldItem.name} control={<Radio
                                                        checked={values[field.name] === fieldItem.name}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        name={field.name} color="secondary"/>}
                                                                      label={fieldItem.label}/>
                                                ))}
                                            </RadioGroup>) : (<FormGroup key={'form-group-' + fieldIndex}>
                                            <InputFieldFormik
                                                label={field.label}
                                                fullWidth
                                                name={field.name}
                                                id={field.name}
                                                domainName={field.domainName}
                                                reference_type={field.reference_type}
                                                component={field.type === 'lookup' ? CollectionSelector: undefined}
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                placeholder={`Enter ${field.label}`}
                                                errorMsg={errors[field.name]}
                                                error={!!(touched[field.name] && errors[field.name])}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                defaultValue={values[field.name]}
                                            />
                                        </FormGroup>)}
                                    </React.Fragment>
                                )}
                            </React.Fragment>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button type="submit" variant="contained" color="primary">
                            {!isSubmitting && <span> Submit </span>} {isSubmitting && (
                            <span>Submitting in <TinySpinner/></span>)}
                        </Button>
                        <Button onClick={handleClose} variant="contained" color="secondary">
                            Cancel
                        </Button>
                    </DialogActions>
                </Form>
            </Dialog>
        </div>
    );
}

const _SendInvitationWindow = withFormik({
    validationSchema: Yup.object().shape({
        email: Yup.string().required('Enter Email'),
        groupName: Yup.string().required('Select Group'),
        companyId: Yup.string().required('Select Company'),
    }),
    mapPropsToValues: props => ({
        email: props.initialValues ? props.initialValues.email : undefined,
        groupName: props.initialValues ? props.initialValues.groupName : 'VIEWER',
        companyId: props.initialValues ? props.initialValues.companyId : undefined,
    }),
    handleSubmit: async (values, {setSubmitting, props}) => {
        const {initialValues} = props;
        const finalData = {...initialValues, ...values};

        if(finalData.email){
            let emails = finalData.email.split(',');
             emails = emails.map((item)=>{
                 return item.trim();
             });
             emails = uniq(compact(emails));
             let errors=[];
             let successCount = 0;
             let _promises = [];

            emails.forEach((item=>{
                let newData = cloneDeep(finalData);
                newData.email = item;
                _promises.push(AdminService.inviteUser(newData).then(()=>{
                    successCount++;
                    return true;
                }).catch(err=>{
                    if(err && err.message){
                        err.message = `(${newData.email})  ${err.message}`
                    }
                    errors.push(err);
                    return true;
                }))

            }));

            Promise.all(_promises).then((result)=>{
                setSubmitting(false);
                if(successCount > 0){
                    props.onSubmitSuccess && props.onSubmitSuccess(`${successCount} users has been invited successfully`);
                }
                errors.forEach((err)=>{
                    props.onSubmitError && props.onSubmitError(err);
                })
            }).catch(err=>{
                setSubmitting(false);
                props.onSubmitError && props.onSubmitError(err);
            })



        }

        //console.log('finalData', finalData);
      /*  AdminService.inviteUser(finalData).then((result) => {
            setSubmitting(false);
            props.onSubmitSuccess && props.onSubmitSuccess(result);
        }).catch((error) => {
            setSubmitting(false);
            props.onSubmitError && props.onSubmitError(error);
        })*/
    },
})(SendInvitationWindow);


export default withStyles(style)(_SendInvitationWindow);
