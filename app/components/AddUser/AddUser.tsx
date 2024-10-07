import { useEffect, useState } from 'react';
import Modal from 'react-modal';

interface User {
  name: string;
  email: string;
  phone: string;
  type?: string;
}

interface AddUserProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addUser: (newUser: Omit<User, 'id'>) => Promise<void>; // Ajuste aqui para incluir o addUser
}

const AddUser: React.FC<AddUserProps> = ({ isOpen, onRequestClose, addUser }) => {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const checkElement = () => {
      const appElement = document.getElementById('__next');
      if (appElement) {
        Modal.setAppElement('#__next');
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      await addUser(formData); // Chama a função addUser recebida como prop
      alert('Usuário adicionado com sucesso!');
      onRequestClose();
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      alert('Erro ao adicionar usuário');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="fixed inset-0 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Adicionar Usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRequestClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddUser;
