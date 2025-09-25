const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/wallets.tsx', 'utf8');

// Substituir loadOverview
content = content.replace(
  /const loadOverview = useCallback\(async \(\) => \{[\s\S]*?setOverview\(response\.data\);[\s\S]*?\}, \[getToken\]\);/,
  `const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await walletService.getOverview();
      setOverview(response);
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
      Alert.alert('Erro', 'Não foi possível carregar as carteiras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);`
);

// Substituir loadGroupTypes
content = content.replace(
  /const loadGroupTypes = useCallback\(async \(\) => \{[\s\S]*?setGroupTypes\(response\.data\.types\);[\s\S]*?\}, \[getToken\]\);/,
  `const loadGroupTypes = useCallback(async () => {
    try {
      const response = await walletService.getGroupTypes();
      setGroupTypes(response.types);
    } catch (error) {
      console.error('Erro ao carregar tipos de grupo:', error);
    }
  }, []);`
);

// Substituir loadPaymentMethodTypes
content = content.replace(
  /const loadPaymentMethodTypes = useCallback\(async \(\) => \{[\s\S]*?setPaymentMethodTypes\(response\.data\.types\);[\s\S]*?\}, \[getToken\]\);/,
  `const loadPaymentMethodTypes = useCallback(async () => {
    try {
      const response = await walletService.getPaymentMethodTypes();
      setPaymentMethodTypes(response.types);
    } catch (error) {
      console.error('Erro ao carregar tipos de método de pagamento:', error);
    }
  }, []);`
);

// Substituir saveGroup
content = content.replace(
  /await api\.post\('\/wallets-v2\/groups', groupForm, \{[\s\S]*?\}\);/,
  `await walletService.createGroup(groupForm);`
);

// Substituir savePaymentMethod
content = content.replace(
  /await api\.post\('\/wallets-v2\/payment-methods', paymentMethodForm, \{[\s\S]*?\}\);/,
  `await walletService.createPaymentMethod(paymentMethodForm);`
);

// Substituir createDefaultGroups
content = content.replace(
  /await api\.post\('\/wallets-v2\/groups\/create-defaults', \{\}, \{[\s\S]*?\}\);/,
  `await walletService.createDefaultGroups();`
);

fs.writeFileSync('app/(tabs)/wallets.tsx', content);
console.log('Arquivo wallets.tsx atualizado com sucesso!');
