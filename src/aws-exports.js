const awsConfig = {
    Auth: {
      identityPoolId: 'YOUR_IDENTITY_POOL_ID',
      region: 'YOUR_REGION'
    },
    API: {
      endpoints: [
        {
          name: 'OTPAPI',
          endpoint: 'YOUR_API_GATEWAY_URL',
          region: 'YOUR_REGION'
        }
      ]
    }
  };
  
  export default awsConfig;