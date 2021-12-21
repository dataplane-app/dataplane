import { TextField, Box, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useLoginUser } from '../../graphql/loginUser';
import {useHistory} from 'react-router-dom';
import { useSnackbar } from 'notistack';

const LoginForm = ({ handleNext }) => {
  let history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const loginUser = useLoginUser();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  async function onSubmit(data) {
    console.log(data);

    const allData = {
        username: data.email,
        password: data.password,
    };

    let response = await loginUser(allData);

    if(response && response?.access_token){
      localStorage.setItem("refresh_token", response.refresh_token);      
      history.push(`loginCallback?accesstoken=${response.access_token}&refreshtoken=${response.refresh_token}`)
    }else{
      response.errors.map(err => {
        enqueueSnackbar(err.message, { variant: "error" });
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ mt: 6, mb: 3 }} display='block'>
        <TextField
          label='Email'
          id='email'
          type='email'
          size='small'
          required
          sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
          {...register('email', { required: true })}
        />

        <TextField
          label='Password'
          id='password'
          type='password'
          size='small'
          required
          sx={{ fontSize: '.75rem', display: 'flex' }}
          {...register('password', { required: true })}
        />
      </Box>

      <Box sx={{ mt: '37px' }}>
        <Button
          variant='contained'
          type='submit'
          color='primary'
          sx={{ width: '100%' }}
        >
          Login
        </Button>
      </Box>
    </form>
  );
};

export default LoginForm;
