import axios from "axios";
import { Container, TextInput, PasswordInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import PropTypes, { InferProps } from "prop-types";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

//
export function Login({ setToken }: InferProps<typeof Login.propTypes>) {

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
    },
  });

  // Submit login to API
  const authLogin = async (username: string, password: string) => {
    const response = await apiClient.post<any>("/ldap_login", {
      username: username,
      password: password,
    })
    .then(function (response: any) {
      console.log('API auth login response:', response);
      setToken(response.data.data);
    })
    .catch(function (error) {
      console.log('API auth login error:', error);
    });
  }

  return (
    <div>
      <h2>User Login</h2>

      <Container size={250} sx={{marginTop: '2em'}}>

        <form onSubmit={form.onSubmit((values) => {
          authLogin(values.username, values.password);
        })}>

          <TextInput
            label="Username"
            placeholder="Username"
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput sx={{marginTop: '1em'}}
            placeholder="Password"
            label="Password"
            required
            {...form.getInputProps('password')}
          />

          <Group position="right" mt="md">
            <Button type="submit">Login</Button>
          </Group>

        </form>
      </Container>

    </div>
  );
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired
}