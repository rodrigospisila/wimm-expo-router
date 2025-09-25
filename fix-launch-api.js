const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/launch.tsx', 'utf8');

// Substituir loadCategories
content = content.replace(
  /const loadCategories = useCallback\(async \(\) => \{[\s\S]*?const response = await api\.get\('\/categories', \{[\s\S]*?\}\);[\s\S]*?setCategories\(response\.data\);[\s\S]*?\}, \[getToken\]\);/,
  `const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const categories = await categoryService.getCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  }, []);`
);

// Substituir loadPaymentMethods
content = content.replace(
  /const loadPaymentMethods = useCallback\(async \(\) => \{[\s\S]*?const \[groupsResponse, methodsResponse\] = await Promise\.all\(\[[\s\S]*?api\.get\('\/wallets-v2\/groups', \{[\s\S]*?\}\),[\s\S]*?api\.get\('\/wallets-v2\/payment-methods', \{[\s\S]*?\}\),[\s\S]*?\]\);[\s\S]*?setWalletGroups\(groupsResponse\.data\);[\s\S]*?setPaymentMethods\(methodsResponse\.data\);[\s\S]*?\}, \[getToken\]\);/,
  `const loadPaymentMethods = useCallback(async () => {
    try {
      setLoadingPaymentMethods(true);
      const [groups, methods] = await Promise.all([
        walletService.getGroups(),
        walletService.getPaymentMethods(),
      ]);
      setWalletGroups(groups);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os métodos de pagamento');
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);`
);

// Substituir createTransaction (installments)
content = content.replace(
  /await api\.post\('\/transactions\/installments', installmentData, \{[\s\S]*?\}\);/,
  `await transactionService.createTransaction(installmentData);`
);

// Substituir createTransaction (normal)
content = content.replace(
  /await api\.post\('\/transactions', transactionData, \{[\s\S]*?\}\);/,
  `await transactionService.createTransaction(transactionData);`
);

fs.writeFileSync('app/(tabs)/launch.tsx', content);
console.log('Arquivo launch.tsx atualizado com sucesso!');
